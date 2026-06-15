/**
 * Cloud Functions for Firebase - Gestor de Tareas Pro
 * 
 * Envía notificaciones push cuando se agregan nuevas tareas
 */

const {setGlobalOptions} = require("firebase-functions");
const {onDocumentWritten} = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();

// For cost control, you can set the maximum number of containers that can be
// running at the same time.
setGlobalOptions({ maxInstances: 10 });

/**
 * Cloud Function que se dispara cuando el documento "inventario/datos" se actualiza.
 * Detecta nuevas tareas agregadas y envía notificaciones push a los empleados asignados.
 */
exports.sendNewTaskNotification = onDocumentWritten(
  { document: "inventario/datos" },
  async (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    // Si no hay datos antes o después, salir
    if (!beforeData || !afterData) {
      logger.log("No hay datos para comparar.");
      return null;
    }

    // Obtener las tareas antes y después
    const beforeTasks = beforeData.tasks || [];
    const afterTasks = afterData.tasks || [];

    // Si no hay tareas nuevas, salir
    if (afterTasks.length <= beforeTasks.length) {
      logger.log("No se detectaron nuevas tareas.");
      return null;
    }

    // Encontrar las tareas nuevas comparando los IDs
    const beforeTaskIds = new Set(beforeTasks.map((t) => t.id));
    const newTasks = afterTasks.filter((t) => !beforeTaskIds.has(t.id));

    if (newTasks.length === 0) {
      logger.log("No se encontraron tareas nuevas.");
      return null;
    }

    logger.log(`Se detectaron ${newTasks.length} tarea(s) nueva(s).`);

    // Obtener la lista de empleados
    const employees = afterData.employees || [];

    // Procesar cada tarea nueva
    for (const task of newTasks) {
      // Si la tarea no tiene un empleado asignado, notificar a todos
      if (!task.employeeId) {
        logger.log(`Tarea "${task.title}" no tiene empleado asignado. Enviando a todos...`);
        // Enviar a todos los empleados que tengan token FCM
        for (const emp of employees) {
          if (emp.fcmToken) {
            await sendNotification(
              emp.fcmToken,
              "Nueva Tarea Disponible",
              `Se ha creado una nueva tarea: ${task.title}`,
              task
            );
          }
        }
        continue;
      }

      // Buscar el empleado asignado
      const employee = employees.find((e) => e.id === task.employeeId);

      if (employee && employee.fcmToken) {
        logger.log(`Enviando notificación a ${employee.name} por la tarea: ${task.title}`);
        await sendNotification(
          employee.fcmToken,
          "Nueva Tarea Asignada",
          `Se te ha asignado la tarea: ${task.title}`,
          task
        );
      } else if (employee) {
        logger.log(`El empleado ${employee.name} no tiene token FCM registrado.`);
      }
    }

    return null;
  }
);

/**
 * Envía una notificación push a un dispositivo específico
 */
async function sendNotification(token, title, body, task) {
  const message = {
    notification: {
      title: title,
      body: body,
      icon: "img/hapa_192.png",
      badge: "img/hapa_96.png",
    },
    data: {
      taskId: task.id || "",
      taskCode: task.code || "",
      click_action: "FLUTTER_NOTIFICATION_CLICK",
    },
    token: token,
  };

  try {
    const response = await admin.messaging().send(message);
    logger.log(`Notificación enviada exitosamente: ${response}`);
    return response;
  } catch (error) {
    logger.error(`Error al enviar notificación:`, error);
    
    // Si el token ya no es válido, podríamos limpiarlo
    if (error.code === "messaging/invalid-registration-token" || 
        error.code === "messaging/registration-token-not-registered") {
      logger.log(`Token inválido, debería ser limpiado.`);
    }
    return null;
  }
}
