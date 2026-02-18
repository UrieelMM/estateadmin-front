rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ───────────── Funciones ─────────────
    function isAuthenticated() {
      return request.auth != null;
    }
    function hasRole(role) {
      return isAuthenticated() && (
        (request.auth.token.role is string && request.auth.token.role == role)
        || (request.auth.token.userRole is string && request.auth.token.userRole == role)
        || (request.auth.token.roles is list && request.auth.token.roles.hasAny([role]))
      );
    }
    function isSuperAdmin() {
      return hasRole('super-provider-admin');
    }
    function isAdmin() {
      return hasRole('admin');
    }
    function isAdminAssistant() {
      return hasRole('admin-assistant');
    }
    function isAdminOrAssistant() {
      return isAdmin() || isAdminAssistant();
    }
    function isMaintenanceUser() {
      return hasRole('maintenance');
    }
    function belongsToClient(clientId) {
      return isAuthenticated() && request.auth.token.clientId == clientId;
    }
    function belongsToClientOrSuperAdmin(clientId) {
      return belongsToClient(clientId) || isSuperAdmin();
    }
    function isValidSupportTicketCreate() {
      return request.resource.data.keys().hasAll([
        'ticketNumber','email','title','description','issueType','priority','module',
        'currentPath','userAgent','attachmentUrls','status','createdBy',
        'createdAt','updatedAt','condominiumId','clientId'
      ])
      && request.resource.data.ticketNumber is string
      && request.resource.data.ticketNumber.matches('^EA-SUPPORT-[A-Z0-9]{16}$')
      && request.resource.data.clientId is string
      && request.resource.data.clientId == request.auth.token.clientId
      && request.resource.data.condominiumId is string
      && request.resource.data.email is string
      && request.resource.data.title is string
      && request.resource.data.description is string
      && request.resource.data.issueType is string
      && request.resource.data.priority is string
      && request.resource.data.module is string
      && request.resource.data.currentPath is string
      && request.resource.data.userAgent is string
      && request.resource.data.attachmentUrls is list
      && request.resource.data.status == 'pending'
      && request.resource.data.createdBy == request.auth.uid
      && request.resource.data.createdAt is timestamp
      && request.resource.data.updatedAt is timestamp;
    }
    function isReconciliationCollection(collectionName) {
      return ['paymentReconciliations', 'expenseReconciliations'].hasAny([collectionName]);
    }
    
    // ─── Colección de Links de Noticias y Guías (ahora lectura pública) ───
    match /linksNewsAndGuides/{docId} {
      allow read:   if true;
      allow create, update, delete: if isSuperAdmin();
    }
    
    // ─── Colección de tickets de soporte ───
    match /supportTickets/{ticketId} {
      allow create: if isAdminOrAssistant() && isValidSupportTicketCreate();
      allow read: if isSuperAdmin();
      allow update, delete: if false;
    }
    
    // ─── Nivel Cliente ───
    match /clients/{clientId} {
      allow read:  if belongsToClientOrSuperAdmin(clientId);
      allow write: if (isAdmin() && belongsToClient(clientId)) || isSuperAdmin();
      
      // ─── Usuarios de App de Mantenimiento ───
      match /maintenanceAppUsers/{userId} {
        // Lectura: admin, super-admin, o el propio usuario de mantenimiento
        allow read: if (isAdmin() && belongsToClient(clientId)) 
                    || isSuperAdmin()
                    || (isMaintenanceUser() && belongsToClient(clientId) && request.auth.uid == userId);
        allow create, update: if (isAdmin() && belongsToClient(clientId)) || isSuperAdmin();
        allow delete: if (isAdmin() && belongsToClient(clientId)) || isSuperAdmin();
      }
      
      // ─── Nivel Condominios ───
      match /condominiums/{condominiumId} {
        allow read:  if belongsToClientOrSuperAdmin(clientId)
                     || (isMaintenanceUser() && belongsToClient(clientId));
        allow write: if (isAdmin() && belongsToClient(clientId)) || isSuperAdmin();
        
        // ─── Empleados ───
        match /employees/{employeeId} {
          // Lectura: admin, assistant, super-admin, o usuario de mantenimiento vinculado
          allow read: if belongsToClientOrSuperAdmin(clientId)
                      || (isMaintenanceUser() && belongsToClient(clientId));
          allow create, update: if (isAdminOrAssistant() && belongsToClient(clientId)) || isSuperAdmin();
          allow delete: if (isAdmin() && belongsToClient(clientId)) || isSuperAdmin();
        }
        
        // ─── Tickets de Mantenimiento ───
        match /ticketsMaintenance/{ticketId} {
          // Lectura: admin, assistant, super-admin, o usuario de mantenimiento del cliente
          allow read: if belongsToClientOrSuperAdmin(clientId)
                      || (isMaintenanceUser() && belongsToClient(clientId));
          // Actualización: admin, assistant, super-admin, o usuario de mantenimiento del cliente
          allow update: if (isAdminOrAssistant() && belongsToClient(clientId)) 
                        || isSuperAdmin()
                        || (isMaintenanceUser() && belongsToClient(clientId));
          allow create: if (isAdminOrAssistant() && belongsToClient(clientId)) || isSuperAdmin();
          allow delete: if (isAdmin() && belongsToClient(clientId)) || isSuperAdmin();
        }
        
        // ─── Reportes de App de Mantenimiento ───
        match /reportsMaintenanceApp/{reportId} {
          // Lectura: admin, assistant, super-admin, o usuario de mantenimiento del cliente
          allow read: if belongsToClientOrSuperAdmin(clientId)
                      || (isMaintenanceUser() && belongsToClient(clientId));
          // Creación: solo usuarios de mantenimiento, admin, assistant o super-admin
          allow create: if (isMaintenanceUser() && belongsToClient(clientId))
                        || (isAdminOrAssistant() && belongsToClient(clientId))
                        || isSuperAdmin();
          // Actualización: solo quien lo creó o admin/super-admin
          allow update: if (isMaintenanceUser() && belongsToClient(clientId) && request.auth.uid == resource.data.maintenanceUserId)
                        || (isAdminOrAssistant() && belongsToClient(clientId))
                        || isSuperAdmin();
          allow delete: if (isAdmin() && belongsToClient(clientId)) || isSuperAdmin();
        }
        
        // ─── Mantenimiento Programado ───
        match /scheduledMaintenance/{taskId} {
          // Lectura: solo usuarios de mantenimiento del cliente
          allow read: if (isMaintenanceUser() && belongsToClient(clientId));
          // Creación: solo usuarios de mantenimiento del cliente
          allow create: if (isMaintenanceUser() && belongsToClient(clientId));
          // Actualización: solo usuarios de mantenimiento del cliente
          allow update: if (isMaintenanceUser() && belongsToClient(clientId));
          // Eliminación: solo usuarios de mantenimiento del cliente
          allow delete: if (isMaintenanceUser() && belongsToClient(clientId));
        }
        
        // ─── Tokens de Notificaciones Push ───
        match /pushTokens/{userId} {
          // Lectura: solo el propio usuario, admin o super-admin
          allow read: if (isAuthenticated() && request.auth.uid == userId && belongsToClient(clientId))
                      || (isAdminOrAssistant() && belongsToClient(clientId))
                      || isSuperAdmin();
          // Escritura: solo el propio usuario puede crear/actualizar su token
          allow create, update: if isAuthenticated() && request.auth.uid == userId && belongsToClient(clientId);
          // Eliminación: el usuario, admin o super-admin
          allow delete: if (isAuthenticated() && request.auth.uid == userId && belongsToClient(clientId))
                        || (isAdmin() && belongsToClient(clientId))
                        || isSuperAdmin();
        }
        
        // ─── Subcolección: Áreas Comunes ───
        match /commonAreas/{areaId} {
          // Lectura: super-admin, admin y admin-assistant
          allow read:   if isSuperAdmin()
                          || (belongsToClient(clientId) && isAdminOrAssistant());
          // Crear/Actualizar: super-admin, admin y admin-assistant
          allow create, update: if isSuperAdmin()
                                  || (belongsToClient(clientId) && isAdminOrAssistant());
          // Borrar: solo super-admin y admin
          allow delete: if isSuperAdmin()
                          || (belongsToClient(clientId) && isAdmin());
        }

        // ─── Usuarios del condominio (incluye referencia de avatar/photoURL) ───
        match /users/{userId} {
          allow read: if belongsToClientOrSuperAdmin(clientId);
          allow create, update: if (isAdminOrAssistant() && belongsToClient(clientId)) || isSuperAdmin();
          allow delete: if (isAdmin() && belongsToClient(clientId)) || isSuperAdmin();
        }

        // ─── QR de asistencia (lectura pública para escaneo) ───
        match /attendanceQR/{qrId} {
          allow read: if true;
          allow create, update: if (isAdminOrAssistant() && belongsToClient(clientId)) || isSuperAdmin();
          allow delete: if (isAdmin() && belongsToClient(clientId)) || isSuperAdmin();
        }

        // ─── Registros de asistencia (creación pública controlada por QR activo) ───
        match /attendance/{attendanceId} {
          allow read: if belongsToClientOrSuperAdmin(clientId);
          // Público para registro desde QR sin autenticación del empleado
          allow create: if true;
          allow update, delete: if (isAdmin() && belongsToClient(clientId)) || isSuperAdmin();
        }

        // ─── Conciliaciones financieras (inmutables para trazabilidad) ───
        match /paymentReconciliations/{sessionId} {
          allow read: if belongsToClientOrSuperAdmin(clientId);
          allow create: if (isAdminOrAssistant() && belongsToClient(clientId)) || isSuperAdmin();
          allow update: if ((isAdminOrAssistant() && belongsToClient(clientId)) || isSuperAdmin())
                        && resource.data.status == 'draft';
          allow delete: if false;
        }

        match /expenseReconciliations/{sessionId} {
          allow read: if belongsToClientOrSuperAdmin(clientId);
          allow create: if (isAdminOrAssistant() && belongsToClient(clientId)) || isSuperAdmin();
          allow update: if ((isAdminOrAssistant() && belongsToClient(clientId)) || isSuperAdmin())
                        && resource.data.status == 'draft';
          allow delete: if false;
        }

        // ─── Bitácora de auditoría transversal ───
        match /auditLogs/{logId} {
          allow read: if belongsToClientOrSuperAdmin(clientId);
          allow create: if (isAdminOrAssistant() && belongsToClient(clientId)) || isSuperAdmin();
          allow update, delete: if false;
        }
        
        // ─── Subcolecciones genéricas de segundo nivel ───
        match /{collection}/{docId} {
          allow read:   if belongsToClientOrSuperAdmin(clientId);
          allow create, update: if !isReconciliationCollection(collection)
                                  && ((isAdminOrAssistant() && belongsToClient(clientId)) || isSuperAdmin());
          allow delete: if !isReconciliationCollection(collection)
                         && ((isAdmin() && belongsToClient(clientId)) || isSuperAdmin());
          
          // ─── Cargos ───
          match /charges/{chargeId} {
            allow read:   if belongsToClientOrSuperAdmin(clientId);
            allow create, update: if ((isAdminOrAssistant() && belongsToClient(clientId)) || isSuperAdmin())
                                   && isValidCharge();
            allow delete: if (isAdmin() && belongsToClient(clientId)) || isSuperAdmin();
            
            // ─── Pagos dentro de Cargos ───
            match /payments/{paymentId} {
              allow read:   if belongsToClientOrSuperAdmin(clientId);
              allow create, update: if ((isAdminOrAssistant() && belongsToClient(clientId)) || isSuperAdmin())
                                     && isValidPayment();
              allow delete: if (isAdmin() && belongsToClient(clientId)) || isSuperAdmin();
            }
          }
          
          // ─── Otras subcolecciones de tercer nivel ───
          match /{subcollection}/{subdocId} {
            allow read:   if belongsToClientOrSuperAdmin(clientId);
            allow create, update: if (isAdminOrAssistant() && belongsToClient(clientId)) || isSuperAdmin();
            allow delete: if (isAdmin() && belongsToClient(clientId)) || isSuperAdmin();
          }
        }

        // ─── Uso de IA (cuotas, agregados y eventos) ───
        match /aiUsageQuota/{featureId} {
          allow read: if belongsToClientOrSuperAdmin(clientId);
          allow create, update: if (isAdminOrAssistant() && belongsToClient(clientId)) || isSuperAdmin();
          allow delete: if isSuperAdmin();
        }

        match /aiUsageDaily/{dateKey} {
          allow read: if belongsToClientOrSuperAdmin(clientId);
          allow create, update: if (isAdminOrAssistant() && belongsToClient(clientId)) || isSuperAdmin();
          allow delete: if isSuperAdmin();
        }

        match /aiUsageEvents/{eventId} {
          allow read: if belongsToClientOrSuperAdmin(clientId);
          allow create: if (isAdminOrAssistant() && belongsToClient(clientId)) || isSuperAdmin();
          allow update, delete: if isSuperAdmin();
        }
      }
    }
    
    // ─── CollectionGroup: pagos (solo lectura para su propio clientId) ───
    match /{path=**}/payments/{paymentId} {
      allow read: if isSuperAdmin()
                  || (isAuthenticated() && resource.data.clientId == request.auth.token.clientId);
    }
    
    // ─── CollectionGroup: cargos (solo lectura para su propio clientId) ───
    match /{path=**}/charges/{chargeId} {
      allow read: if isSuperAdmin()
                  || (isAuthenticated() && resource.data.clientId == request.auth.token.clientId);
    }

    // ─── CollectionGroup: facturas generadas ───
    match /{path=**}/invoicesGenerated/{invoiceId} {
      allow read: if isSuperAdmin()
                  || (isAuthenticated() && resource.data.clientId == request.auth.token.clientId);
    }

    // ─── CollectionGroup: consumo IA diario ───
    match /{path=**}/aiUsageDaily/{docId} {
      allow read: if isSuperAdmin()
                  || (isAuthenticated() && resource.data.clientId == request.auth.token.clientId);
    }

    // ─── CollectionGroup: eventos de consumo IA ───
    match /{path=**}/aiUsageEvents/{docId} {
      allow read: if isSuperAdmin()
                  || (isAuthenticated() && resource.data.clientId == request.auth.token.clientId);
    }
    
    // ─── publicQRs en ruta específica ───
    match /clients/{clientId}/condominiums/{condominiumId}/publicQRs/{qrId} {
      allow read:   if true;
      allow create: if isAuthenticated()
                    && (request.resource.data.clientId == request.auth.token.clientId || isSuperAdmin());
      allow update, delete: if false;
    }
    
    // ─── CollectionGroup: publicQRs (solo lectura) ───
    match /{path=**}/publicQRs/{qrId} {
      allow read: if true;
    }

    // ─── CollectionGroup: attendanceQR (lectura pública para escaneo) ───
    match /{path=**}/attendanceQR/{qrId} {
      allow read: if true;
    }

    // ─── CollectionGroup: attendance (registro público por QR) ───
    match /{path=**}/attendance/{attendanceId} {
      allow create: if true;
    }

    // ─── Rutas absolutas públicas de asistencia (fallback explícito) ───
    match /clients/{clientId}/condominiums/{condominiumId}/attendanceQR/{qrId} {
      allow read: if true;
    }

    match /clients/{clientId}/condominiums/{condominiumId}/publicQRs/{qrId} {
      allow read: if true;
      allow create: if true;
    }

    match /clients/{clientId}/condominiums/{condominiumId}/attendance/{attendanceId} {
      allow create: if true;
    }
    
    // ─── Validaciones para "charges" y "payments" ───
    function isValidCharge() {
      return request.resource.data.keys().hasAll([
        'amount','clientId','concept','condominiumId',
        'dueDate','generatedAt','paid','referenceAmount',
        'startAt','email','name','notificationSent','chargeId'
      ])
      && (request.resource.data.amount is int || request.resource.data.amount is float)
      && request.resource.data.clientId is string
      && request.resource.data.concept is string
      && request.resource.data.condominiumId is string
      && request.resource.data.dueDate is string
      && request.resource.data.startAt is string
      && request.resource.data.generatedAt is timestamp
      && request.resource.data.paid is bool
      && (request.resource.data.referenceAmount is int || request.resource.data.referenceAmount is float)
      && request.resource.data.email is string
      && request.resource.data.name is string
      && request.resource.data.notificationSent is bool
      && request.resource.data.chargeId is string;
    }
    function isValidPayment() {
      return request.resource.data.keys().hasAll([
        'amountPaid','amountPending','attachmentPayment','chargeUID',
        'clientId','comments','concept','condominiumId',
        'creditBalance','creditUsed','dateRegistered','email',
        'financialAccountId','folio','invoiceRequired','month',
        'numberCondominium','paymentDate','paymentGroupId',
        'paymentReference',
        'paymentId','paymentType','phone','startAt',
        'userId','yearMonth', 'paymentAmountReference'
      ])
      && (request.resource.data.amountPaid is int || request.resource.data.amountPaid is float)
      && (request.resource.data.amountPending is int || request.resource.data.amountPending is float)
      && (request.resource.data.paymentAmountReference is int || request.resource.data.paymentAmountReference is float)
      && request.resource.data.attachmentPayment is string
      && request.resource.data.chargeUID is string
      && request.resource.data.clientId is string
      && request.resource.data.comments is string
      && request.resource.data.concept is string
      && request.resource.data.condominiumId is string
      && (request.resource.data.creditBalance is int || request.resource.data.creditBalance is float)
      && (request.resource.data.creditUsed is int || request.resource.data.creditUsed is float)
      && request.resource.data.dateRegistered is timestamp
      && request.resource.data.email is string
      && request.resource.data.financialAccountId is string
      && request.resource.data.folio is string
      && request.resource.data.invoiceRequired is bool
      && request.resource.data.month is string
      && request.resource.data.numberCondominium is string
      && request.resource.data.paymentDate is timestamp
      && request.resource.data.paymentGroupId is string
      && request.resource.data.paymentReference is string
      && request.resource.data.paymentId is string
      && request.resource.data.paymentType is string
      && (request.resource.data.phone is int || request.resource.data.phone is float)
      && request.resource.data.startAt is string
      && request.resource.data.userId is string
      && request.resource.data.yearMonth is string;
    }
  }
}
