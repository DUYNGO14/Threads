import { atom } from "recoil";
import { loadEncryptedData } from "../../utils/encryptedData";

const userAtom = atom({
  key: "userAtom",
  default: loadEncryptedData("user-threads"),
});

export default userAtom;
