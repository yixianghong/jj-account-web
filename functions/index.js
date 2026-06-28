const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');

admin.initializeApp();

exports.notifyOnNewTransaction = onDocumentCreated(
    {
        document: 'accountBooks/{bookId}/transactions/{transactionId}',
        region: 'asia-east1',
        database: '(default)',
    },
    async (event) => {
        const { bookId } = event.params;
        console.log('Function 觸發，bookId:', bookId);
        const transaction = event.data?.data();
        if (!transaction) {
            console.log('transaction 資料為空，結束');
            return;
        }

        const db = admin.firestore();

        // 取得記帳本資料（owner + sharedUsers）
        const bookSnap = await db.doc(`accountBooks/${bookId}`).get();
        if (!bookSnap.exists) return;

        const book = bookSnap.data();
        const ownerUid = book.userId;
        const sharedEmails = book.sharedUsers || [];

        // 收集 FCM token，並記錄每個 token 來自哪個文件（供失效時清除）
        const tokenEntries = []; // { token, ref }

        const addTokensFrom = async (fcmRef) => {
            const snap = await fcmRef.get();
            if (snap.exists) {
                (snap.data().tokens || []).forEach((token) => {
                    tokenEntries.push({ token, ref: fcmRef });
                });
            }
        };

        // 擁有者的 token（存於私密子集合 users/{uid}/private/fcm）
        await addTokensFrom(db.doc(`users/${ownerUid}/private/fcm`));

        // 共享使用者的 token（先用 email 查 uid，再讀各自的私密子集合）
        if (sharedEmails.length > 0) {
            const usersSnap = await db.collection('users')
                .where('email', 'in', sharedEmails)
                .get();
            await Promise.all(
                usersSnap.docs.map((userDoc) =>
                    addTokensFrom(db.doc(`users/${userDoc.id}/private/fcm`))
                )
            );
        }

        const tokens = tokenEntries.map((e) => e.token);
        console.log('收集到的 tokens 數量:', tokens.length);
        if (tokens.length === 0) {
            console.log('沒有 FCM token，結束');
            return;
        }

        // 組裝通知內容
        const typeText = transaction.type === 'income' ? '收入' : '支出';
        const amountText = `$${Number(transaction.amount).toLocaleString()}`;
        const detail = transaction.description || transaction.category;

        const message = {
            notification: {
                title: `📒 ${book.name}`,
                body: `${transaction.recorder} 新增了${typeText} ${amountText}｜${detail}`,
            },
            // Web 推播由瀏覽器自動顯示 notification（SW 不再手動顯示，避免重複），
            // 在此提供顯示外觀（icon）
            webpush: {
                notification: {
                    icon: '/icons/icon-192x192.png',
                },
            },
            tokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`推播結果：成功 ${response.successCount}，失敗 ${response.failureCount}`);

        // 清除失效的 token（依來源文件分組後以 arrayRemove 移除），避免死 token 無限累積
        const invalidByRef = new Map(); // ref.path -> { ref, tokens: [] }
        response.responses.forEach((resp, i) => {
            if (resp.success) return;
            const code = resp.error?.code;
            if (
                code === 'messaging/registration-token-not-registered' ||
                code === 'messaging/invalid-registration-token' ||
                code === 'messaging/invalid-argument'
            ) {
                const { token, ref } = tokenEntries[i];
                if (!invalidByRef.has(ref.path)) {
                    invalidByRef.set(ref.path, { ref, tokens: [] });
                }
                invalidByRef.get(ref.path).tokens.push(token);
            }
        });

        if (invalidByRef.size > 0) {
            const refs = [...invalidByRef.values()];
            await Promise.all(
                refs.map(({ ref, tokens: badTokens }) =>
                    ref.update({
                        tokens: admin.firestore.FieldValue.arrayRemove(...badTokens),
                    })
                )
            );
            const removed = refs.reduce((n, x) => n + x.tokens.length, 0);
            console.log(`已清除 ${removed} 個失效 token`);
        }
    }
);
