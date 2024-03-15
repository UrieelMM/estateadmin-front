export interface UserData {
    email: string;
    name: string;
    lastName?: string;
    RFC?: string;
    address?: string;
    CP?: string;
    city?: string;
    state?: string;
    country?: string;
    number?: string;
    phone?: string;
    businessName?: string;
    taxResidence?: string;
    taxtRegime?: string;
    photoURL?: File | string;
    uid: string;
    companyName?: string;
    condominiumName?: string[];
    role: string;
    departament?: string;
}