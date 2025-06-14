import { ref } from 'vue'
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'

export const useUsers = () => {
    const users = ref<{ [key: string]: { displayName: string | null; uid: string } }>({})

    const getUserInfo = async (identifier: string) => {
        console.log('正在查詢使用者:', identifier);

        if (users.value[identifier]) {
            console.log('從快取中取得使用者資料:', users.value[identifier]);
            return users.value[identifier];
        }

        const db = getFirestore()
        let userData = null;
        let uid = identifier;

        // 先嘗試用 uid 查詢
        try {
            const userRef = doc(db, 'users', identifier);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
                userData = userDoc.data();
                console.log('使用 uid 找到使用者:', userData);
            }
        } catch (err) {
            console.log('uid 查詢失敗，嘗試使用 email 查詢', err);
        }

        // 如果 uid 查詢失敗，嘗試用 email 查詢
        if (!userData) {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', identifier));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                userData = querySnapshot.docs[0].data();
                uid = querySnapshot.docs[0].id;
                console.log('使用 email 找到使用者:', userData);
            }
        }

        if (userData) {
            users.value[identifier] = {
                displayName: userData.displayName || null,
                uid
            };
            return users.value[identifier];
        }

        return { displayName: null, uid: identifier };
    }

    return {
        users,
        getUserInfo
    }
} 