import { db } from "./firebase-config.js";
import { collection, getDocs } from "firebase/firestore";

async function testFirestore() {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    
    snapshot.forEach((doc) => {
        console.log(doc.id, "=>", doc.data());
    });
}

testFirestore();
