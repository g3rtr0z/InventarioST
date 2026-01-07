import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

/**
 * Verifica que quien llama sea administrador.
 * Usamos la colección 'userRoles' para validar que el email del caller tenga rol 'administrador'.
 */
async function assertCallerIsAdmin(context: functions.https.CallableContext) {
  if (!context.auth || !context.auth.token || !context.auth.token.email) {
    throw new functions.https.HttpsError('unauthenticated', 'Autenticación requerida.');
  }
  const callerEmail = String(context.auth.token.email).toLowerCase();
  const roleDoc = await db.collection('userRoles').doc(callerEmail).get();
  if (!roleDoc.exists || (roleDoc.data()?.role !== 'administrador')) {
    throw new functions.https.HttpsError('permission-denied', 'Solo administradores pueden realizar esta acción.');
  }
}

/**
 * Elimina un usuario en Firebase Authentication (por email) y limpia sus registros en Firestore.
 * Espera un objeto { email: string }.
 */
export const adminDeleteAuthUser = functions.https.onCall(async (data, context) => {
  await assertCallerIsAdmin(context);

  const email: string | undefined = data?.email;
  if (!email || typeof email !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Se requiere el email del usuario a eliminar.');
  }

  const normalizedEmail = email.toLowerCase();

  try {
    // Buscar UID por email y eliminar en Auth si existe
    const userRecord = await admin.auth().getUserByEmail(normalizedEmail).catch(() => null);
    if (userRecord && userRecord.uid) {
      await admin.auth().deleteUser(userRecord.uid);
    }

    // Limpiar Firestore (idempotente)
    await Promise.allSettled([
      db.collection('users').doc(normalizedEmail).delete(),
      db.collection('userRoles').doc(normalizedEmail).delete()
    ]);

    return { success: true };
  } catch (err: any) {
    // Si algo falla, devolver error controlado
    const message = err?.message || 'Error al eliminar el usuario en Auth/Firestore';
    throw new functions.https.HttpsError('internal', message);
  }
});


