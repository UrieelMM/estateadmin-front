import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";

export interface CustomChargeConcept {
  id: string;
  name: string;
  normalizedName: string;
}

export const sanitizeConcept = (value: string): string =>
  value
    .normalize("NFKC")
    .replace(/[–—]/g, "-")
    .replace(/[^A-Za-z0-9À-ÿ .,;:()/$%#&'+?!_-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);

export const conceptKey = (value: string): string =>
  sanitizeConcept(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX");

const conceptsCollection = async () => {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Usuario no autenticado");
  const claims = await getIdTokenResult(user);
  const clientId = claims.claims.clientId as string;
  const condominiumId = localStorage.getItem("condominiumId");
  if (!clientId || !condominiumId) throw new Error("Selecciona un condominio");
  return collection(
    getFirestore(),
    `clients/${clientId}/condominiums/${condominiumId}/customChargeConcepts`,
  );
};

export const listCustomChargeConcepts = async (): Promise<CustomChargeConcept[]> => {
  const snapshot = await getDocs(await conceptsCollection());
  return snapshot.docs
    .map((item) => ({
      id: item.id,
      name: String(item.data().name || ""),
      normalizedName: String(item.data().normalizedName || ""),
    }))
    .filter((item) => item.name)
    .sort((a, b) => a.name.localeCompare(b.name, "es-MX"));
};

export const saveCustomChargeConcept = async (
  rawName: string,
  existing: CustomChargeConcept[],
  id?: string,
): Promise<string> => {
  const name = sanitizeConcept(rawName);
  if (name.length < 2) throw new Error("Escribe al menos 2 caracteres para el concepto");
  const normalizedName = conceptKey(name);
  if (existing.some((item) => item.id !== id && conceptKey(item.name) === normalizedName)) {
    throw new Error("Ese concepto ya existe");
  }
  const data = { name, normalizedName, updatedAt: serverTimestamp() };
  if (id) {
    await updateDoc(doc(await conceptsCollection(), id), data);
  } else {
    await addDoc(await conceptsCollection(), { ...data, createdAt: serverTimestamp() });
  }
  return name;
};
