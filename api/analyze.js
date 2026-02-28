export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text, image, category } = req.body;
  if (!text && !image) return res.status(400).json({ error: "No content provided" });

  const categoryHint = category ? `نوع الرسالة: ${category}\n\n` : "";

  const systemPrompt = `أنت مساعد متخصص في شرح الرسائل الرسمية الألمانية للناطقين بالعربية.

اشرح هذه الرسالة بالعربية البسيطة بهذا الشكل:

🔹 ماذا تعني هذه الرسالة؟
[شرح واضح]

📋 ماذا يجب أن تفعل؟
[خطوات واضحة مرقمة]

⏰ المواعيد المهمة:
[المواعيد أو: لا يوجد موعد محدد]

⚡ مستوى الأهمية: [عاجل جداً / مهم / عادي]

💡 نصيحة:
[نصيحة مفيدة]`;

  let userContent;
  if (image) {
    // image is a full data URL like "data:image/jpeg;base64,..."
    userContent = [
      {
        type: "image_url",
        image_url: { url: image, detail: "high" }
      },
      {
        type: "text",
        text: categoryHint + "اشرح هذه الرسالة الرسمية الألمانية بالعربية:"
      }
    ];
  } else {
    userContent = categoryHint + text;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ],
        max_tokens: 1500
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    return res.status(200).json({ result: data.choices[0].message.content });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
