import { ref } from 'vue'
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { useErrorHandler } from '../composables/useErrorHandler'

export const useUsers = () => {
    const { handleError } = useErrorHandler();
    const users = ref<{ [key: string]: { displayName: string | null; uid: string } }>({})

    const getUserInfo = async (identifier: string) => {
        try {
            if (users.value[identifier]) {
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
                }
            } catch (err) {
                handleError(err, '使用 UID 查詢使用者失敗');
            }

            // 如果 uid 查詢失敗，嘗試用 email 查詢
            if (!userData) {
                try {
                    const usersRef = collection(db, 'users');
                    const q = query(usersRef, where('email', '==', identifier));
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        userData = querySnapshot.docs[0].data();
                        uid = querySnapshot.docs[0].id;
                    }
                } catch (err) {
                    handleError(err, '使用 Email 查詢使用者失敗');
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
        } catch (error) {
            handleError(error, '查詢使用者資料失敗');
            return { displayName: null, uid: identifier };
        }
    }

    return {
        users,
        getUserInfo
    }
} 