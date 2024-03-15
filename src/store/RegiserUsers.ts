// src/stores/condominiumStore.ts
import {create} from 'zustand'
import { getAuth, getIdTokenResult } from 'firebase/auth';

interface CondominiumState {
    sendExcel: (file: File, condominiumName: string) => Promise<void>;
  }
  
  export const useCondominiumStore = create<CondominiumState>(() => ({
      sendExcel: async (file: File, condominiumName: string) => {
        if (!file.name.match(/\.(xls|xlsx)$/)) {
          alert('El archivo debe ser un Excel (.xls, .xlsx)');
          return;
        }
    
        if (file.size > 10485760) { // 10MB
          alert('El archivo no debe pesar más de 10MB');
          return;
        }
    
        const auth = getAuth();
        const user = auth.currentUser;
    
        if (!user) {
          alert('Usuario no autenticado');
          return;
        }
    
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims['clientId']; // Asegúrate de que la clave 'clientId' es correcta
    
        if (!clientId) {
          alert('ClientId no disponible');
          return;
        }
    
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('condominiumName', condominiumName);
          formData.append('clientId', String(clientId));
    
          const response = await fetch('http://localhost:3000/users-auth/register-condominiums', {
            method: 'POST',
            body: formData,
            headers: {
              "Accept": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
          });
    
          if (!response.ok) {
            throw new Error('Error al enviar el formulario');
          }
    
          // Manejo cuando la respuesta es un archivo
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `credeintial_${Date.now()}.xlsx`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(downloadUrl);
          a.remove();
    
        } catch (error) {
            console.error('Error al enviar el formulario: ', error);
        }
      },
  }));