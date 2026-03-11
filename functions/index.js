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

        const tokens = [];

        // 取得擁有者的 FCM tokens
        const ownerSnap = await db.doc(`users/${ownerUid}`).get();
        if (ownerSnap.exists) {
            const ownerTokens = ownerSnap.data().fcmTokens || [];
            tokens.push(...ownerTokens);
        }

        // 取得共享使用者的 FCM tokens（用 email 查詢）
        if (sharedEmails.length > 0) {
            const usersSnap = await db.collection('users')
                .where('email', 'in', sharedEmails)
                .get();

            usersSnap.docs.forEach(doc => {
                const userTokens = doc.data().fcmTokens || [];
                tokens.push(...userTokens);
            });
        }

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
            tokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`推播結果：成功 ${response.successCount}，失敗 ${response.failureCount}`);
    }
);
