import type { CallInsights, CallLanguage, SalesStatus, Speaker, TranscriptMessage } from "@/lib/types"

interface ScriptLine {
  speaker: Speaker
  text: string
}

const ENGLISH: ScriptLine[] = [
  { speaker: "agent", text: "Hi {name}, this is Aria, an AI assistant calling on behalf of {product}. Is this a good time for a quick two-minute chat?" },
  { speaker: "customer", text: "Sure, I have a few minutes. What is this about?" },
  { speaker: "agent", text: "{product} helps teams automate task tracking and follow-ups. How does your team currently manage its work?" },
  { speaker: "customer", text: "Mostly spreadsheets and WhatsApp groups. It gets messy once we pass ten people." },
  { speaker: "agent", text: "That's very common. {product} centralizes everything and auto-assigns owners. Would a Google Sheets integration matter to you?" },
  { speaker: "customer", text: "Yes, that would help. My concern is pricing — we're a small team and budgets are tight." },
  { speaker: "agent", text: "Understood. There's a starter plan for teams under 25 seats and a 14-day trial. Would a short demo this week work?" },
  { speaker: "customer", text: "A demo on Thursday could work. Please send the details over email." },
  { speaker: "agent", text: "Perfect — I'll send a Thursday invite along with starter plan pricing. Thanks for your time, {name}!" },
]

const HINGLISH: ScriptLine[] = [
  { speaker: "agent", text: "Hi {name}, main Aria bol rahi hoon, {product} ki taraf se ek AI assistant. Kya abhi do minute baat kar sakte hain?" },
  { speaker: "customer", text: "Haan, bataiye. Kis baare mein hai?" },
  { speaker: "agent", text: "{product} teams ke tasks aur follow-ups automate karta hai. Abhi aapki team kaam kaise track karti hai?" },
  { speaker: "customer", text: "Zyada tar Excel sheets aur WhatsApp groups pe. Team badi hone pe thoda messy ho jaata hai." },
  { speaker: "agent", text: "Samajh sakti hoon. {product} sab tasks ek jagah laata hai aur owners auto-assign karta hai. Google Sheets integration useful hoga?" },
  { speaker: "customer", text: "Haan, woh helpful hoga. Bas pricing ka thoda concern hai, hum chhoti team hain." },
  { speaker: "agent", text: "Bilkul. Chhoti teams ke liye starter plan hai, aur 14-day free trial bhi. Kya is week ek short demo rakh sakte hain?" },
  { speaker: "customer", text: "Thursday ko demo chalega. Details email kar dijiye." },
  { speaker: "agent", text: "Perfect, main Thursday ka invite aur starter plan ki pricing email kar dungi. Thank you, {name}!" },
]

const HINDI: ScriptLine[] = [
  { speaker: "agent", text: "नमस्ते {name}, मैं Aria, {product} की ओर से एक AI सहायक बोल रही हूँ। क्या अभी दो मिनट बात कर सकते हैं?" },
  { speaker: "customer", text: "हाँ, बताइए। किस बारे में है?" },
  { speaker: "agent", text: "{product} आपकी टीम के काम और फ़ॉलो-अप अपने आप व्यवस्थित करता है। अभी आपकी टीम काम कैसे ट्रैक करती है?" },
  { speaker: "customer", text: "ज़्यादातर एक्सेल शीट और व्हाट्सऐप ग्रुप पर। टीम बड़ी होने पर मुश्किल हो जाती है।" },
  { speaker: "agent", text: "समझ सकती हूँ। {product} सारे काम एक जगह लाता है। क्या गूगल शीट्स से जुड़ना आपके लिए उपयोगी होगा?" },
  { speaker: "customer", text: "हाँ, वह उपयोगी होगा। बस कीमत को लेकर थोड़ी चिंता है, हमारी टीम छोटी है।" },
  { speaker: "agent", text: "बिल्कुल। छोटी टीमों के लिए स्टार्टर प्लान और 14 दिन का मुफ़्त ट्रायल है। क्या इस हफ़्ते एक छोटा डेमो रख सकते हैं?" },
  { speaker: "customer", text: "गुरुवार को डेमो ठीक रहेगा। जानकारी ईमेल कर दीजिए।" },
  { speaker: "agent", text: "बहुत बढ़िया, मैं गुरुवार का निमंत्रण और कीमत की जानकारी ईमेल कर दूँगी। धन्यवाद, {name}!" },
]

export function getSimulationScript(language: CallLanguage, vars: { name: string; product: string }) {
  const script = language === "hi" ? HINDI : language === "hinglish" ? HINGLISH : ENGLISH
  return script.map((line) => ({
    speaker: line.speaker,
    text: line.text.replaceAll("{name}", vars.name).replaceAll("{product}", vars.product),
  }))
}

function nextWeekday(from: Date, weekday: number) {
  const result = new Date(from)
  const diff = (weekday - result.getDay() + 7) % 7 || 7
  result.setDate(result.getDate() + diff)
  return result.toISOString().slice(0, 10)
}

/**
 * Builds demo insights for a simulated session. This is deterministic sample
 * output keyed to the simulation script — it is NOT AI analysis.
 * Replace with `callsApi.getInsights(callId)` once the backend is connected.
 */
export function buildSimulatedInsights(params: {
  transcript: TranscriptMessage[]
  customerName: string
  productName: string
}): CallInsights {
  const { transcript, customerName, productName } = params
  const customerTurns = transcript.filter((message) => message.speaker === "customer").length
  const firstName = customerName.split(" ")[0] || customerName

  const requirements: string[] = []
  const objections: string[] = []
  const nextSteps: string[] = []
  let salesStatus: SalesStatus = "Follow-up Required"

  if (customerTurns >= 2) {
    requirements.push("Replace spreadsheet + WhatsApp task tracking", "Scale cleanly beyond 10 team members")
  }
  if (customerTurns >= 3) {
    requirements.push("Google Sheets integration")
    objections.push("Budget sensitivity — small team")
    salesStatus = "Interested"
  }
  if (customerTurns >= 4) {
    nextSteps.push("Send Thursday demo invite", "Share starter plan pricing (< 25 seats)", "Offer 14-day trial activation link")
    salesStatus = "Demo Requested"
  } else {
    nextSteps.push(`Call ${firstName} back to complete discovery`, "Send a short product overview email")
  }
  if (objections.length === 0) objections.push("No objections captured — call ended early")

  const summary =
    customerTurns >= 4
      ? `${customerName} manages team work in spreadsheets and WhatsApp, which breaks down past ten people. Interested in ${productName}'s auto-assignment and Google Sheets integration. Main concern is pricing for a small team. Agreed to a Thursday demo; send invite and starter plan pricing by email.`
      : `Partial conversation with ${customerName} about ${productName}. Discovery was not completed before the call ended. Recommend a follow-up call to understand requirements and budget.`

  return {
    requirements: requirements.length ? requirements : ["Not enough conversation to identify requirements"],
    objections,
    sentiment: customerTurns >= 4 ? "Positive" : "Neutral",
    sentimentScore: customerTurns >= 4 ? 78 : 52,
    nextSteps,
    followUpDate: nextWeekday(new Date(), 4),
    summary,
    salesStatus,
    source: "simulated",
  }
}
