const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Cloud Function to send a push notification when a new task is assigned.
 * This triggers whenever the main data document in Firestore is updated.
 */
exports.sendNewTaskNotification = functions.firestore
    .document("inventario/datos")
    .onUpdate(async (change) => {
      const beforeData = change.before.data();
      const afterData = change.after.data();

      // Do nothing if tasks array doesn't exist or hasn't grown
      if (!afterData.tasks || !beforeData.tasks || afterData.tasks.length <= beforeData.tasks.length) {
        console.log("No new tasks were added.");
        return null;
      }

      // Find the newly added tasks by comparing the arrays
      const oldTaskIds = new Set(beforeData.tasks.map((t) => t.id));
      const newTasks = afterData.tasks.filter((t) => !oldTaskIds.has(t.id));

      if (newTasks.length === 0) {
        return null;
      }

      // Process each new task
      for (const task of newTasks) {
        if (!task.employeeId) {
          continue; // Skip if the task is not assigned to anyone
        }

      // Enviar notificación global a TODOS los empleados con token FCM
        const employees = afterData.employees || [];
        let sentCount = 0;
        for (const emp of employees) {
          if (emp.fcmToken) {
            const payload = {
              notification: {
                title: "Nueva Tarea Disponible",
                body: `Se ha creado una nueva tarea: ${task.title}`,
                icon: "img/hapa_512.png",
              },
            };
            console.log(`Enviando notificación global a dispositivo (token: ...${emp.fcmToken.slice(-10)})`);
            await admin.messaging().sendToDevice(emp.fcmToken, payload);
            sentCount++;
          }
        }
        console.log(`Notificación enviada a ${sentCount} dispositivo(s) para la tarea: ${task.title}`);
      }
      return null;
    });