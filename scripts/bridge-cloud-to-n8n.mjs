import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://it_helpdesk_admin:Helpdesk123@helpmate-cluster.ftjbnuq.mongodb.net/it_helpdesk';
const N8N_INTAKE_URL = process.env.N8N_INTAKE_URL || 'http://localhost:5678/webhook/ticket-intake';
const POLL_INTERVAL_MS = 3000;

console.log('🚀 Khởi động cầu nối Cloud-to-n8n (MongoDB Atlas Bridge)...');

try {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Đã kết nối thành công tới MongoDB Atlas!');
} catch (err) {
  console.error('❌ Lỗi kết nối MongoDB Atlas:', err);
  process.exit(1);
}

const TicketCollection = mongoose.connection.collection('tickets');

// Đánh dấu các ticket cũ đã tồn tại để không kích hoạt lại
const existingUnprocessed = await TicketCollection.updateMany(
  { n8nDispatched: { $exists: false } },
  { $set: { n8nDispatched: true, n8nDispatchedAt: new Date(), note: 'Initial backlog sync' } }
);
console.log(`📌 Đã đồng bộ khởi tạo: đánh dấu ${existingUnprocessed.modifiedCount} ticket cũ.`);

console.log(`👂 Đang lắng nghe ticket mới từ web Vercel (mỗi ${POLL_INTERVAL_MS / 1000}s)...`);

let isProcessing = false;

setInterval(async () => {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const newTickets = await TicketCollection.find({
      n8nDispatched: { $ne: true }
    }).limit(5).toArray();

    for (const ticket of newTickets) {
      console.log(`\n🎫 Phát hiện ticket mới từ Vercel: [${ticket.ticketId}] "${ticket.title}"`);
      console.log(`📡 Đang chuyển tiếp sang luồng n8n intake: ${N8N_INTAKE_URL}...`);

      try {
        const response = await fetch(N8N_INTAKE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId: ticket.ticketId,
            title: ticket.title,
            description: ticket.description,
            requesterName: 'Người dùng Web Vercel',
            requesterEmail: 'support@helpmeta.ai',
            source: 'Vercel-Web-Cloud'
          }),
          signal: AbortSignal.timeout(20000)
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ n8n đã xử lý thành công ticket ${ticket.ticketId}!`);
          console.log(`   - Danh mục: ${result.category || ticket.category}`);
          console.log(`   - Nhóm: ${result.assignedTeam || ticket.assignedTeam}`);
          console.log(`   - SLA: ${result.sla?.status || 'Active'}`);

          await TicketCollection.updateOne(
            { _id: ticket._id },
            {
              $set: {
                n8nDispatched: true,
                n8nDispatchedAt: new Date(),
                n8nEnriched: true
              }
            }
          );
        } else {
          console.warn(`⚠️ n8n phản hồi HTTP ${response.status}`);
        }
      } catch (err) {
        console.error(`❌ Lỗi khi gửi ticket ${ticket.ticketId} sang n8n:`, err.message);
      }
    }
  } catch (loopErr) {
    console.error('Lỗi vòng lặp quét ticket:', loopErr.message);
  } finally {
    isProcessing = false;
  }
}, POLL_INTERVAL_MS);
