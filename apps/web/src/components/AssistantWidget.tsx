"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Bot,
  LoaderCircle,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type AssistantContext = "home" | "tracking";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type AssistantWidgetProps = {
  context: AssistantContext;
  trackingNumber?: string;
  language?: string;
};

const translations: Record<
  string,
  Record<string, string>
> = {
  en: {
    title: "Logistics Assistant",
    subtitle: "Your shipping support assistant",
    welcome:
      "Hello! I'm your logistics assistant. I can help with shipping, tracking, customs, deliveries and other questions. How can I help you today?",
    trackingWelcome:
      "Hello! I've connected to the shipment you're viewing. Ask me about its current status, tracking history, customs requirements or next steps.",
    placeholder: "Ask me anything about your shipment...",
    send: "Send message",
    thinking: "Preparing your answer...",
    error:
      "I'm temporarily unable to respond. Please try again shortly.",
    online: "Here to help",
    powered: "AI CUSTOMER SUPPORT",
  },
  fr: {
    title: "Assistant logistique",
    subtitle: "Votre assistant d'expédition",
    welcome:
      "Bonjour ! Je suis votre assistant logistique. Je peux vous aider concernant les expéditions, le suivi, les douanes et les livraisons.",
    trackingWelcome:
      "Bonjour ! Je suis connecté à l'expédition affichée. Posez-moi vos questions sur son statut, son historique ou les formalités douanières.",
    placeholder: "Posez votre question...",
    send: "Envoyer",
    thinking: "Préparation de la réponse...",
    error: "Impossible de répondre pour le moment. Réessayez bientôt.",
    online: "À votre service",
    powered: "ASSISTANCE CLIENTÈLE IA",
  },
  es: {
    title: "Asistente logístico",
    subtitle: "Su asistente de envíos",
    welcome:
      "¡Hola! Soy su asistente logístico. Puedo ayudarle con envíos, seguimiento, aduanas y entregas.",
    trackingWelcome:
      "¡Hola! Estoy conectado al envío que está consultando. Pregúnteme sobre su estado, historial o requisitos aduaneros.",
    placeholder: "Escriba su pregunta...",
    send: "Enviar",
    thinking: "Preparando respuesta...",
    error: "No puedo responder ahora. Inténtelo de nuevo pronto.",
    online: "Aquí para ayudar",
    powered: "ATENCIÓN AL CLIENTE CON IA",
  },
  de: {
    title: "Logistikassistent",
    subtitle: "Ihr Versandassistent",
    welcome:
      "Hallo! Ich bin Ihr Logistikassistent. Ich helfe Ihnen bei Versand, Sendungsverfolgung, Zoll und Zustellung.",
    trackingWelcome:
      "Hallo! Ich bin mit der angezeigten Sendung verbunden. Fragen Sie mich nach Status, Verlauf oder Zollanforderungen.",
    placeholder: "Stellen Sie Ihre Frage...",
    send: "Senden",
    thinking: "Antwort wird vorbereitet...",
    error: "Ich kann momentan nicht antworten. Bitte versuchen Sie es später erneut.",
    online: "Wir helfen Ihnen gerne",
    powered: "KI-KUNDENSERVICE",
  },
  ar: {
    title: "المساعد اللوجستي",
    subtitle: "مساعد الشحن الخاص بك",
    welcome:
      "مرحباً! أنا مساعدك اللوجستي. يمكنني مساعدتك في الشحن والتتبع والجمارك والتوصيل.",
    trackingWelcome:
      "مرحباً! أنا متصل بالشحنة التي تعرضها. يمكنك السؤال عن حالتها وسجل التتبع والمتطلبات الجمركية.",
    placeholder: "اكتب سؤالك هنا...",
    send: "إرسال",
    thinking: "جارٍ إعداد الإجابة...",
    error: "تعذر الرد حالياً. يرجى المحاولة مرة أخرى قريباً.",
    online: "نحن هنا للمساعدة",
    powered: "دعم العملاء بالذكاء الاصطناعي",
  },
  zh: {
    title: "物流助手",
    subtitle: "您的货运支持助手",
    welcome:
      "您好！我是您的物流助手，可以帮助您了解运输、物流追踪、海关和配送。",
    trackingWelcome:
      "您好！我已连接您正在查看的货件。您可以询问货件状态、追踪记录和清关要求。",
    placeholder: "请输入您的问题...",
    send: "发送",
    thinking: "正在准备回复...",
    error: "暂时无法回复，请稍后重试。",
    online: "随时为您服务",
    powered: "AI 客户支持",
  },
  ru: {
    title: "Логистический помощник",
    subtitle: "Помощник по доставке",
    welcome:
      "Здравствуйте! Я ваш логистический помощник. Я могу помочь с доставкой, отслеживанием, таможней и другими вопросами.",
    trackingWelcome:
      "Здравствуйте! Я подключён к отправлению, которое вы просматриваете. Спросите меня о статусе, истории или таможенных требованиях.",
    placeholder: "Задайте свой вопрос...",
    send: "Отправить",
    thinking: "Готовлю ответ...",
    error: "Сейчас не удаётся ответить. Попробуйте немного позже.",
    online: "Готов помочь",
    powered: "ИИ-ПОДДЕРЖКА КЛИЕНТОВ",
  },
  pt: {
    title: "Assistente logístico",
    subtitle: "Seu assistente de envio",
    welcome:
      "Olá! Sou seu assistente logístico. Posso ajudar com envios, rastreamento, alfândega e entregas.",
    trackingWelcome:
      "Olá! Estou conectado à remessa que você está consultando. Pergunte sobre o status, histórico ou requisitos alfandegários.",
    placeholder: "Digite sua pergunta...",
    send: "Enviar",
    thinking: "Preparando resposta...",
    error: "Não consigo responder agora. Tente novamente em breve.",
    online: "Aqui para ajudar",
    powered: "SUPORTE AO CLIENTE COM IA",
  },
  uk: {
    title: "Логістичний помічник",
    subtitle: "Ваш помічник із доставки",
    welcome:
      "Вітаю! Я ваш логістичний помічник. Допоможу з доставкою, відстеженням, митницею та іншими питаннями.",
    trackingWelcome:
      "Вітаю! Я підключений до відправлення, яке ви переглядаєте. Запитуйте про статус, історію та митні вимоги.",
    placeholder: "Напишіть своє запитання...",
    send: "Надіслати",
    thinking: "Готую відповідь...",
    error: "Зараз не вдається відповісти. Спробуйте пізніше.",
    online: "Раді допомогти",
    powered: "ПІДТРИМКА КЛІЄНТІВ З ШІ",
  },
};

export default function AssistantWidget({
  context,
  trackingNumber,
  language = "en",
}: AssistantWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isRTL = language === "ar";

  const labels =
    translations[language] || translations.en;

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content:
          context === "tracking"
            ? labels.trackingWelcome
            : labels.welcome,
      },
    ]);
  }, [context, trackingNumber, language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isSending, isOpen]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = input.trim();

    if (!message || isSending) {
      return;
    }

    if (context === "tracking" && !trackingNumber) {
      return;
    }

    const updatedMessages: ChatMessage[] = [
      ...messages,
      {
        role: "user",
        content: message,
      },
    ];

    setMessages(updatedMessages);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch(
        `${API_URL}/api/v1/assistant/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            context,
            message,
            ...(context === "tracking"
              ? { tracking_number: trackingNumber }
              : {}),
            conversation_history: updatedMessages
              .slice(-8)
              .slice(0, -1),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Assistant request failed.");
      }

      const data: { reply?: string } =
        await response.json();

      if (!data.reply) {
        throw new Error("Empty assistant response.");
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.reply!,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: labels.error,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="fixed bottom-5 right-5 z-[80] sm:bottom-7 sm:right-7"
    >
      {isOpen && (
        <section
          aria-label={labels.title}
          className="mb-4 flex h-[min(570px,calc(100dvh-110px))] w-[min(390px,calc(100vw-40px))] flex-col overflow-hidden rounded-[24px] border border-[#e4eaf2] bg-white shadow-[0_24px_80px_rgba(20,36,58,0.20)]"
        >
          <header className="relative overflow-hidden bg-[#14243a] px-5 py-5 text-white">
            <div className="absolute -right-10 -top-14 h-36 w-36 rounded-full border border-white/10" />
            <div className="absolute -right-2 -top-7 h-24 w-24 rounded-full border border-white/10" />

            <div className="relative flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border border-white/15 bg-white/10">
                  <Bot size={23} strokeWidth={1.7} />
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-[14px] font-bold tracking-wide">
                    {labels.title}
                  </h2>

                  <p className="mt-1 text-[10px] text-white/65">
                    {labels.subtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close assistant"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                <X size={19} />
              </button>
            </div>

            <div className="relative mt-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#42d6a0]" />
              <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/75">
                {labels.online}
              </span>
            </div>
          </header>

          <div
            className="flex-1 space-y-4 overflow-y-auto bg-[#f7f9fc] px-4 py-5"
            aria-live="polite"
          >
            <div className="mb-3 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5ebf3] bg-white px-3 py-1.5 text-[8px] font-bold tracking-[0.15em] text-[#8290a3]">
                <Sparkles size={11} />
                {labels.powered}
              </span>
            </div>

            {messages.map((item, index) => (
              <div
                key={`${index}-${item.role}`}
                className={`flex ${
                  item.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {item.role === "assistant" && (
                  <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-[#14243a] text-white">
                    <Bot size={15} />
                  </div>
                )}

                <div
                  className={`max-w-[84%] whitespace-pre-wrap break-words rounded-[17px] px-4 py-3 text-[12px] leading-[1.7] ${
                    item.role === "user"
                      ? "rounded-br-md bg-[#2457d6] text-white"
                      : "rounded-bl-md border border-[#e8edf4] bg-white text-[#35445a] shadow-sm"
                  }`}
                >
                  {item.content}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-[#14243a] text-white">
                  <Bot size={15} />
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-[#e8edf4] bg-white px-4 py-3 text-[11px] text-[#8290a3]">
                  <LoaderCircle
                    size={14}
                    className="animate-spin text-[#2457d6]"
                  />
                  {labels.thinking}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={sendMessage}
            className="border-t border-[#e9eef4] bg-white p-4"
          >
            <div className="flex items-end gap-2 rounded-[16px] border border-[#e2e9f1] bg-[#f8fafd] p-2 transition focus-within:border-[#2457d6] focus-within:ring-2 focus-within:ring-[#2457d6]/10">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();

                    const form = event.currentTarget.form;

                    form?.requestSubmit();
                  }
                }}
                rows={1}
                maxLength={1500}
                placeholder={labels.placeholder}
                aria-label={labels.placeholder}
                className="max-h-24 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-[12px] leading-5 text-[#14243a] outline-none placeholder:text-[#9ba7b7]"
              />

              <button
                type="submit"
                disabled={!input.trim() || isSending}
                aria-label={labels.send}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#2457d6] text-white transition hover:bg-[#1949c5] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </div>

            <p className="mt-2 text-center text-[9px] text-[#9aa6b5]">
              Responses are provided by the AI support assistant.
            </p>
          </form>
        </section>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-label={
            isOpen ? "Close assistant" : "Open logistics assistant"
          }
          aria-expanded={isOpen}
          className="group flex h-[60px] w-[60px] items-center justify-center rounded-[21px] bg-[#14243a] text-white shadow-[0_12px_35px_rgba(20,36,58,0.25)] transition duration-300 hover:-translate-y-1 hover:bg-[#2457d6] sm:h-[64px] sm:w-[64px]"
        >
          {isOpen ? (
            <X size={25} />
          ) : (
            <div className="relative">
              <MessageCircle size={27} strokeWidth={1.8} />

              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#14243a] bg-[#42d6a0]">
                <span className="h-1 w-1 rounded-full bg-white" />
              </span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}