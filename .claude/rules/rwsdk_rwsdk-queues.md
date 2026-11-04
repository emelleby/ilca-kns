---
type: "agent_requested"
---

# RedwoodSDK: Background tasks with Cloudflare Queues

You're an expert at Cloudflare Queues, TypeScript, and building web apps with RedwoodSDK. Generate high quality **background task implementations** that adhere to the following best practices:

## Guidelines

1. Use Cloudflare Queues for handling asynchronous tasks that shouldn't block the main request
2. Structure queue messages with proper typing and metadata
3. Implement robust error handling for queue consumers
4. Choose appropriate message storage strategies based on payload size
5. Organize queue handlers for maintainability and scalability
6. Follow proper retry and backoff strategies for failed tasks

## Example Templates

### Basic Queue Setup

Set up the required components for using Cloudflare Queues:

```tsx
// src/worker.tsx
import { defineApp } from "rwsdk/worker";
import { route } from "rwsdk/router";
import { env } from "cloudflare:workers";

// Define your routes
const app = defineApp([
  // Your routes here
]);

// Export both the fetch handler and queue handler
export default {
  fetch: app.fetch,
  async queue(batch) {
    for (const message of batch.messages) {
      try {
        // Parse the message body
        const data = JSON.parse(message.body);
        console.log(`Processing message: ${JSON.stringify(data)}`);
        
        // Handle the message based on its type
        if (data.type === 'EMAIL') {
          await handleEmailTask(data);
        } else if (data.type === 'PAYMENT') {
          await handlePaymentTask(data);
        } else if (data.type === 'NOTIFICATION') {
          await handleNotificationTask(data);
        } else {
          console.error(`Unknown message type: ${data.type}`);
        }
        
        // Acknowledge the message was processed successfully
        message.ack();
      } catch (error) {
        console.error(`Error processing message: ${error}`);
        // Retry the message by not acknowledging it
        // The message will be retried automatically
      }
    }
  }
} satisfies ExportedHandler<Env>;

// Task handler implementations
async function handleEmailTask(data) {
  // Implementation for sending emails
  console.log(`Sending email to ${data.recipient}`);
  // ... email sending logic
}

async function handlePaymentTask(data) {
  // Implementation for processing payments
  console.log(`Processing payment of ${data.amount} ${data.currency}`);
  // ... payment processing logic
}

async function handleNotificationTask(data) {
  // Implementation for sending notifications
  console.log(`Sending notification to user ${data.userId}`);
  // ... notification logic
}
```

### Centralized Queue Service

Create a reusable service for working with queues:

```tsx
// src/lib/queue.ts
import { env } from "cloudflare:workers";

// Define message types for type safety
export type EmailTask = {
  type: 'EMAIL';
  recipient: string;
  subject: string;
  body: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
};

export type PaymentTask = {
  type: 'PAYMENT';
  userId: number;
  amount: number;
  currency: string;
  paymentMethod: string;
  orderId: string;
};

export type NotificationTask = {
  type: 'NOTIFICATION';
  userId: number;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  channel: 'email' | 'push' | 'sms' | 'in-app';
};

// Union type of all possible task types
export type QueueTask = EmailTask | PaymentTask | NotificationTask;

export class QueueService {
  private env: Env;
  
  constructor(env: Env) {
    this.env = env;
  }
  
  // Send a task to the queue
  async sendTask<T extends QueueTask>(task: T): Promise<void> {
    try {
      // Check if the payload is too large (>128KB)
      const payload = JSON.stringify(task);
      const payloadSize = new TextEncoder().encode(payload).length;
      
      if (payloadSize > 128 * 1024) {
        // For large payloads, store in R2 and send a reference
        const key = `queue/${task.type.toLowerCase()}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.json`;
        await this.env.R2.put(key, payload);
        
        // Send only the reference to the queue
        await this.env.QUEUE.send({
          type: `${task.type}_REF`,
          storageType: 'R2',
          storageKey: key,
        });
        
        console.log(`Large task sent to queue with R2 reference: ${key}`);
      } else {
        // For small payloads, send directly
        await this.env.QUEUE.send(task);
        console.log(`Task sent to queue: ${task.type}`);
      }
    } catch (error) {
      console.error(`Failed to send task to queue: ${error}`);
      throw new Error(`Queue error: ${error.message}`);
    }
  }
  
  // Helper methods for common task types
  async sendEmail(email: Omit<EmailTask, 'type'>): Promise<void> {
    return this.sendTask({
      type: 'EMAIL',
      ...email,
    });
  }
  
  async processPayment(payment: Omit<PaymentTask, 'type'>): Promise<void> {
    return this.sendTask({
      type: 'PAYMENT',
      ...payment,
    });
  }
  
  async sendNotification(notification: Omit<NotificationTask, 'type'>): Promise<void> {
    return this.sendTask({
      type: 'NOTIFICATION',
      ...notification,
    });
  }
}

// Create and export a function to get the queue service
export function getQueueService(env: Env): QueueService {
  return new QueueService(env);
}
```

### Queue Consumer Implementation

```tsx
// src/worker.tsx
import { defineApp } from "rwsdk/worker";
import { env } from "cloudflare:workers";
import { QueueTask } from "./lib/queue";

const app = defineApp([
  // Your routes here
]);

export default {
  fetch: app.fetch,
  async queue(batch) {
    // Determine which queue is sending the message
    const queueName = batch.queue;
    console.log(`Processing batch from queue: ${queueName}`);
    
    for (const message of batch.messages) {
      try {
        const data = JSON.parse(message.body);
        
        // Check if this is a reference to stored data
        if (data.type && data.type.endsWith('_REF')) {
          // Extract the base type
          const baseType = data.type.replace('_REF', '');
          
          // Retrieve the full data based on storage type
          let fullData;
          
          if (data.storageType === 'R2') {
            const storedData = await env.R2.get(data.storageKey);
            if (!storedData) {
              throw new Error(`R2 object not found: ${data.storageKey}`);
            }
            fullData = JSON.parse(await storedData.text());
          } else if (data.storageType === 'KV') {
            const storedData = await env.KV.get(data.storageKey);
            if (!storedData) {
              throw new Error(`KV entry not found: ${data.storageKey}`);
            }
            fullData = JSON.parse(storedData);
          } else {
            throw new Error(`Unknown storage type: ${data.storageType}`);
          }
          
          // Process the full data with the original type
          await processTask(fullData);
          
          // Clean up the stored data if needed
          if (data.storageType === 'R2') {
            await env.R2.delete(data.storageKey);
          }
        } else {
          // Process direct message
          await processTask(data);
        }
        
        // Acknowledge successful processing
        message.ack();
      } catch (error) {
        console.error(`Error processing message: ${error}`);
        
        // Get retry count from message metadata or default to 0
        const retryCount = message.retryCount || 0;
        
        if (retryCount < 3) {
          // Don't acknowledge, allowing automatic retry
          console.log(`Message will be retried (attempt ${retryCount + 1})`);
        } else {
          // Too many retries, acknowledge but log the failure
          console.error(`Message failed after ${retryCount} retries, giving up`);
          message.ack();
          
          // Optionally send to a dead letter queue
          await sendToDeadLetterQueue(message.body, error);
        }
      }
    }
  }
} satisfies ExportedHandler<Env>;

// Process a task based on its type
async function processTask(data: QueueTask) {
  switch (data.type) {
    case 'EMAIL':
      await sendEmail(data);
      break;
    case 'PAYMENT':
      await processPayment(data);
      break;
    case 'NOTIFICATION':
      await sendNotification(data);
      break;
    default:
      throw new Error(`Unknown task type: ${(data as any).type}`);
  }
}

// Implementation of task handlers
async function sendEmail(data: EmailTask) {
  console.log(`Sending email to ${data.recipient}`);
  // Implement email sending logic
  // For example, using a service like Resend, SendGrid, etc.
}

async function processPayment(data: PaymentTask) {
  console.log(`Processing payment of ${data.amount} ${data.currency}`);
  // Implement payment processing logic
  // For example, using Stripe, PayPal, etc.
}

async function sendNotification(data: NotificationTask) {
  console.log(`Sending ${data.priority} priority notification to user ${data.userId} via ${data.channel}`);
  // Implement notification logic based on the channel
  // For example, push notifications, SMS, etc.
}

// Send failed messages to a dead letter queue for later inspection
async function sendToDeadLetterQueue(messageBody: string, error: Error) {
  try {
    await env.DEAD_LETTER_QUEUE.send({
      originalMessage: messageBody,
      error: error.message,
      timestamp: Date.now(),
    });
  } catch (dlqError) {
    console.error(`Failed to send to dead letter queue: ${dlqError}`);
  }
}
```

### Using Queues in API Routes

```tsx
// src/app/routes.ts
import { route } from "rwsdk/router";
import { getQueueService } from "../lib/queue";

export default [
  // Route for sending a welcome email
  route("/api/users", async function handler({ request, env }) {
    try {
      const userData = await request.json();
      
      // Create the user in the database
      const user = await env.DB.prepare(`
        INSERT INTO users (name, email, created_at)
        VALUES (?, ?, ?)
      `).bind(
        userData.name,
        userData.email,
        new Date().toISOString()
      ).run();
      
      // Send welcome email asynchronously via queue
      const queueService = getQueueService(env);
      await queueService.sendEmail({
        recipient: userData.email,
        subject: "Welcome to our platform!",
        body: `Hello ${userData.name}, welcome to our platform!`,
      });
      
      return Response.json({
        success: true,
        message: "User created successfully",
      }, { status: 201 });
    } catch (error) {
      console.error("Error creating user:", error);
      return Response.json({
        success: false,
        error: "Failed to create user",
      }, { status: 500 });
    }
  }, { method: "POST" }),
  
  // Route for processing a payment
  route("/api/orders", async function handler({ request, env }) {
    try {
      const orderData = await request.json();
      
      // Validate the order data
      if (!orderData.userId || !orderData.amount || !orderData.paymentMethod) {
        return Response.json({
          success: false,
          error: "Missing required fields",
        }, { status: 400 });
      }
      
      // Create the order in the database
      const order = await env.DB.prepare(`
        INSERT INTO orders (user_id, amount, currency, status, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        orderData.userId,
        orderData.amount,
        orderData.currency || "USD",
        "pending",
        new Date().toISOString()
      ).run();
      
      // Get the order ID
      const { results } = await env.DB.prepare(`
        SELECT last_insert_rowid() as id
      `).all();
      const orderId = results[0].id;
      
      // Process payment asynchronously via queue
      const queueService = getQueueService(env);
      await queueService.processPayment({
        userId: orderData.userId,
        amount: orderData.amount,
        currency: orderData.currency || "USD",
        paymentMethod: orderData.paymentMethod,
        orderId: orderId.toString(),
      });
      
      return Response.json({
        success: true,
        message: "Order created and payment processing started",
        orderId,
      }, { status: 202 }); // 202 Accepted indicates the request has been accepted for processing
    } catch (error) {
      console.error("Error creating order:", error);
      return Response.json({
        success: false,
        error: "Failed to create order",
      }, { status: 500 });
    }
  }, { method: "POST" }),
  
  // Route for sending notifications
  route("/api/notifications", async function handler({ request, env }) {
    try {
      const notificationData = await request.json();
      
      // Validate notification data
      if (!notificationData.userId || !notificationData.message) {
        return Response.json({
          success: false,
          error: "Missing required fields",
        }, { status: 400 });
      }
      
      // Send notification asynchronously via queue
      const queueService = getQueueService(env);
      await queueService.sendNotification({
        userId: notificationData.userId,
        title: notificationData.title || "New Notification",
        message: notificationData.message,
        priority: notificationData.priority || "medium",
        channel: notificationData.channel || "in-app",
      });
      
      return Response.json({
        success: true,
        message: "Notification queued for delivery",
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      return Response.json({
        success: false,
        error: "Failed to send notification",
      }, { status: 500 });
    }
  }, { method: "POST" }),
];
```

### Scheduled Tasks with Queues

```tsx
// src/worker.tsx
import { defineApp } from "rwsdk/worker";
import { env } from "cloudflare:workers";
import { getQueueService } from "./lib/queue";

const app = defineApp([
  // Your routes here
]);

export default {
  fetch: app.fetch,
  
  // Handle queue messages
  async queue(batch) {
    // Queue message handling logic
  },
  
  // Handle scheduled events
  async scheduled(event, env, ctx) {
    console.log(`Running scheduled task: ${event.cron}`);
    
    // Different tasks based on the cron expression
    if (event.cron === "0 0 * * *") {
      // Daily task at midnight
      await runDailyReports(env);
    } else if (event.cron === "0 * * * *") {
      // Hourly task
      await runHourlyCleanup(env);
    } else if (event.cron === "*/5 * * * *") {
      // Every 5 minutes
      await checkPendingOrders(env);
    }
  }
} satisfies ExportedHandler<Env>;

// Daily report generation
async function runDailyReports(env: Env) {
  const queueService = getQueueService(env);
  
  // Get users who need daily reports
  const { results } = await env.DB.prepare(`
    SELECT id, email, name FROM users
    WHERE daily_report_enabled = 1
  `).all();
  
  // Queue email tasks for each user
  for (const user of results) {
    await queueService.sendEmail({
      recipient: user.email,
      subject: "Your Daily Report",
      body: `Hello ${user.name}, here's your daily report...`,
    });
  }
  
  console.log(`Queued ${results.length} daily reports`);
}

// Hourly cleanup task
async function runHourlyCleanup(env: Env) {
  // Delete expired temporary files
  const objects = await env.R2.list({ prefix: "temp/" });
  
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  
  for (const object of objects.objects) {
    if (object.uploaded.getTime() < oneHourAgo) {
      await env.R2.delete(object.key);
      console.log(`Deleted expired file: ${object.key}`);
    }
  }
}

// Check pending orders
async function checkPendingOrders(env: Env) {
  const queueService = getQueueService(env);
  
  // Get orders that have been pending for more than 15 minutes
  const fifteenMinutesAgo = new Date(Date.now() - (15 * 60 * 1000)).toISOString();
  
  const { results } = await env.DB.prepare(`
    SELECT o.id, o.user_id, u.email, u.name
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.status = 'pending'
    AND o.created_at < ?
  `).bind(fifteenMinutesAgo).all();
  
  // Send notifications for stalled orders
  for (const order of results) {
    await queueService.sendNotification({
      userId: order.user_id,
      title: "Order Processing Delay",
      message: `Your order #${order.id} is taking longer than expected to process.`,
      priority: "high",
      channel: "email",
    });
    
    console.log(`Sent delay notification for order #${order.id}`);
  }
}
```

### Multiple Queue Management

```tsx
// src/worker.tsx
import { defineApp } from "rwsdk/worker";
import { env } from "cloudflare:workers";

const app = defineApp([
  // Your routes here
]);

export default {
  fetch: app.fetch,
  
  async queue(batch) {
    // Handle different queues
    switch (batch.queue) {
      case "email-queue":
        await processEmailQueue(batch);
        break;
      case "payment-queue":
        await processPaymentQueue(batch);
        break;
      case "notification-queue":
        await processNotificationQueue(batch);
        break;
      case "dead-letter-queue":
        await processDeadLetterQueue(batch);
        break;
      default:
        console.error(`Unknown queue: ${batch.queue}`);
    }
  }
} satisfies ExportedHandler<Env>;

// Process email queue
async function processEmailQueue(batch) {
  for (const message of batch.messages) {
    try {
      const data = JSON.parse(message.body);
      console.log(`Sending email to ${data.recipient}`);
      
      // Email sending implementation
      // ...
      
      message.ack();
    } catch (error) {
      console.error(`Error processing email: ${error}`);
      // Handle retry logic
    }
  }
}

// Process payment queue
async function processPaymentQueue(batch) {
  for (const message of batch.messages) {
    try {
      const data = JSON.parse(message.body);
      console.log(`Processing payment of ${data.amount} ${data.currency}`);
      
      // Payment processing implementation
      // ...
      
      message.ack();
    } catch (error) {
      console.error(`Error processing payment: ${error}`);
      // Handle retry logic
    }
  }
}

// Process notification queue
async function processNotificationQueue(batch) {
  for (const message of batch.messages) {
    try {
      const data = JSON.parse(message.body);
      console.log(`Sending notification to user ${data.userId}`);
      
      // Notification sending implementation
      // ...
      
      message.ack();
    } catch (error) {
      console.error(`Error sending notification: ${error}`);
      // Handle retry logic
    }
  }
}

// Process dead letter queue
async function processDeadLetterQueue(batch) {
  for (const message of batch.messages) {
    try {
      const data = JSON.parse(message.body);
      console.log(`Processing dead letter: ${JSON.stringify(data)}`);
      
      // Log the failed message for investigation
      console.error(`Failed message: ${data.originalMessage}`);
      console.error(`Error: ${data.error}`);
      console.error(`Timestamp: ${new Date(data.timestamp).toISOString()}`);
      
      // You might want to store this in a database or send alerts
      
      message.ack();
    } catch (error) {
      console.error(`Error processing dead letter: ${error}`);
      // Always acknowledge dead letters to prevent infinite loops
      message.ack();
    }
  }
}
```

### Batch Processing with Queues

```tsx
// src/worker.tsx
import { defineApp } from "rwsdk/worker";
import { env } from "cloudflare:workers";

const app = defineApp([
  // Route for triggering a batch process
  route("/api/batch/process-users", async function handler({ env }) {
    try {
      // Get all users that need processing
      const { results } = await env.DB.prepare(`
        SELECT id FROM users
        WHERE needs_processing = 1
        LIMIT 1000
      `).all();
      
      // Create batches of 100 users each
      const batchSize = 100;
      const batches = [];
      
      for (let i = 0; i < results.length; i += batchSize) {
        const batch = results.slice(i, i + batchSize);
        batches.push(batch);
      }
      
      // Queue each batch for processing
      for (let i = 0; i < batches.length; i++) {
        await env.BATCH_QUEUE.send({
          batchId: `user-batch-${Date.now()}-${i}`,
          userIds: batches[i].map(user => user.id),
          totalBatches: batches.length,
          batchIndex: i,
        });
      }
      
      return Response.json({
        success: true,
        message: `Queued ${results.length} users for processing in ${batches.length} batches`,
      });
    } catch (error) {
      console.error("Error queuing batch process:", error);
      return Response.json({
        success: false,
        error: "Failed to queue batch process",
      }, { status: 500 });
    }
  })
]);

export default {
  fetch: app.fetch,
  
  async queue(batch) {
    if (batch.queue === "batch-queue") {
      await processBatch(batch);
    }
    // Handle other queues...
  }
} satisfies ExportedHandler<Env>;

// Process a batch of users
async function processBatch(batch) {
  for (const message of batch.messages) {
    try {
      const data = JSON.parse(message.body);
      console.log(`Processing batch ${data.batchIndex + 1}/${data.totalBatches} with ${data.userIds.length} users`);
      
      // Process each user in the batch
      for (const userId of data.userIds) {
        await processUser(userId);
      }
      
      // Update batch status
      await updateBatchStatus(data.batchId, "completed");
      
      // Check if this was the last batch
      if (data.batchIndex === data.totalBatches - 1) {
        console.log(`All batches completed for job starting with batch ID: ${data.batchId}`);
        // Perform any final processing or notifications
      }
      
      message.ack();
    } catch (error) {
      console.error(`Error processing batch: ${error}`);
      
      // Update batch status
      try {
        const data = JSON.parse(message.body);
        await updateBatchStatus(data.batchId, "failed", error.message);
      } catch (statusError) {
        console.error(`Failed to update batch status: ${statusError}`);
      }
      
      // Handle retry logic
    }
  }
}

// Process a single user
async function processUser(userId) {
  console.log(`Processing user ${userId}`);
  
  // Implement user processing logic
  // ...
  
  // Mark user as processed
  await env.DB.prepare(`
    UPDATE users
    SET needs_processing = 0, last_processed_at = ?
    WHERE id = ?
  `).bind(new Date().toISOString(), userId).run();
}

// Update batch status
async function updateBatchStatus(batchId, status, errorMessage = null) {
  await env.DB.prepare(`
    INSERT INTO batch_jobs (batch_id, status, error_message, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT (batch_id) DO UPDATE
    SET status = ?, error_message = ?, updated_at = ?
  `).bind(
    batchId,
    status,
    errorMessage,
    new Date().toISOString(),
    status,
    errorMessage,
    new Date().toISOString()
  ).run();
}
```
