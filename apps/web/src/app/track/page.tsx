"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import AssistantWidget from "../../components/AssistantWidget";
import { useSearchParams } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Box,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Globe2,
  MapPin,
  Package,
  RefreshCw,
  ShieldCheck,
  Truck,
  Weight,
  CircleDollarSign,
  FileText,
  AlertCircle,
  Plane,
} from "lucide-react";

import LanguageSelector from "../../components/LanguageSelector";
import { useLanguage } from "../../components/LanguageProvider";

type TrackingEvent = {
  status: string;
  title: string;
  description?: string | null;
  location?: string | null;
  country_code?: string | null;
  event_time: string;
};

type CustomsStatus = {
  status: string;
  customs_reference?: string | null;
  required_action?: string | null;
};

type PaymentRequirement = {
  reference: string;
  description: string;
  amount: string | number;
  currency: string;
  status: string;
  due_at?: string | null;
};

type TrackingData = {
  tracking_number: string;
  shipment_type: string;
  status: string;
  origin_country: string;
  origin_city?: string | null;
  destination_country: string;
  destination_city?: string | null;
  description?: string | null;
  weight_kg?: string | number | null;
  declared_value?: string | number | null;
  declared_currency?: string | null;
  estimated_delivery_at?: string | null;
  delivered_at?: string | null;
  tracking_events: TrackingEvent[];
  customs?: CustomsStatus | null;
  payment_required?: PaymentRequirement | null;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const messages: Record<string, Record<string, string>> = {
  en: {
    intelligence: "GLOBAL LOGISTICS",
    platform: "INTELLIGENCE PLATFORM",
    trackAnother: "Track another shipment",
    breadcrumb: "Shipment tracking",
    shipmentOverview: "SHIPMENT OVERVIEW",
    latestMovement: "LATEST MOVEMENT",
    origin: "ORIGIN",
    destination: "DESTINATION",
    shipmentType: "SHIPMENT TYPE",
    estimatedArrival: "ESTIMATED ARRIVAL",
    deliveryStatus: "DELIVERY STATUS",
    currentStatus: "Current status",
    estimatedDelivery: "Estimated delivery",
    shipmentWeight: "Shipment weight",
    declaredValue: "Declared value",
    notProvided: "Not provided",
    notAvailable: "Not available",
    movementHistory: "MOVEMENT HISTORY",
    timeline: "Shipment timeline",
    events: "events",
    latest: "LATEST",
    noEvents: "No movement events available",
    noEventsDescription:
      "Shipment events will appear here when operational updates become available.",
    shipmentProfile: "SHIPMENT PROFILE",
    shipmentDetails: "Shipment details",
    reference: "Reference",
    type: "Type",
    weight: "Weight",
    customsOperations: "CROSS-BORDER OPERATIONS",
    customs: "Customs",
    requiredAction: "Required action",
    shipmentRequirement: "SHIPMENT REQUIREMENT",
    paymentRequired: "Payment required",
    amountDue: "Amount due",
    due: "Due",
    shipmentLookup: "SHIPMENT LOOKUP",
    unavailable: "Shipment unavailable",
    tryAgain: "Try another reference",
    noReference: "No tracking reference was provided.",
    notFound:
      "We could not find a shipment associated with this tracking reference.",
    retrievalError:
      "We couldn't retrieve the shipment information right now.",
    generalError:
      "Something went wrong while retrieving the shipment.",
    loading: "LOADING SHIPMENT",
    secure: "Secure tracking",
    visibility: "Global visibility",
    operations: "Operational intelligence",
    footer: "All rights reserved.",
    created: "Created",
    waiting_for_pickup: "Waiting for Pickup",
    pickup_scheduled: "Pickup Scheduled",
    picked_up: "Picked Up",
    pickup_failed: "Pickup Failed",
    received: "Received",
    processing: "Processing",
    departed_facility: "Departed Facility",
    in_transit: "In Transit",
    arrived_at_facility: "Arrived at Facility",
    arrived_at_destination: "Arrived at Destination",
    customs_clearance: "Customs Clearance",
    customs_inspection: "Customs Inspection",
    customs_hold: "Customs Hold",
    customs_cleared: "Customs Cleared",
    released_from_customs: "Released from Customs",
    out_for_delivery: "Out for Delivery",
    delivery_attempted: "Delivery Attempted",
    delivery_failed: "Delivery Failed",
    ready_for_collection: "Ready for Collection",
    delivered: "Delivered",
    on_hold: "On Hold",
    damaged: "Damaged",
    lost: "Lost",
    returned_to_sender: "Returned to Sender",
    return_delivered: "Return Delivered",
    cancelled: "Cancelled",
    parcel: "Parcel",
    freight: "Freight",
    cargo: "Cargo",
    vehicle: "Vehicle",
  },

  fr: {
    intelligence: "LOGISTIQUE MONDIALE",
    platform: "PLATEFORME INTELLIGENTE",
    trackAnother: "Suivre un autre envoi",
    breadcrumb: "Suivi de l'envoi",
    shipmentOverview: "APERÇU DE L'ENVOI",
    latestMovement: "DERNIER MOUVEMENT",
    origin: "ORIGINE",
    destination: "DESTINATION",
    shipmentType: "TYPE D'ENVOI",
    estimatedArrival: "ARRIVÉE ESTIMÉE",
    deliveryStatus: "STATUT DE LIVRAISON",
    currentStatus: "Statut actuel",
    estimatedDelivery: "Livraison estimée",
    shipmentWeight: "Poids de l'envoi",
    declaredValue: "Valeur déclarée",
    notProvided: "Non renseigné",
    notAvailable: "Non disponible",
    movementHistory: "HISTORIQUE DES MOUVEMENTS",
    timeline: "Chronologie de l'envoi",
    events: "événements",
    latest: "RÉCENT",
    noEvents: "Aucun événement disponible",
    noEventsDescription: "Les événements apparaîtront ici lorsque les mises à jour seront disponibles.",
    shipmentProfile: "PROFIL DE L'ENVOI",
    shipmentDetails: "Détails de l'envoi",
    reference: "Référence",
    type: "Type",
    weight: "Poids",
    customsOperations: "OPÉRATIONS TRANSFRONTALIÈRES",
    customs: "Douanes",
    requiredAction: "Action requise",
    shipmentRequirement: "EXIGENCE DE L'ENVOI",
    paymentRequired: "Paiement requis",
    amountDue: "Montant dû",
    due: "Échéance",
    shipmentLookup: "RECHERCHE D'ENVOI",
    unavailable: "Envoi indisponible",
    tryAgain: "Essayer une autre référence",
    noReference: "Aucune référence de suivi fournie.",
    notFound: "Aucun envoi correspondant à cette référence n'a été trouvé.",
    retrievalError: "Impossible de récupérer les informations de l'envoi.",
    generalError: "Une erreur est survenue lors de la récupération de l'envoi.",
    loading: "CHARGEMENT DE L'ENVOI",
    secure: "Suivi sécurisé",
    visibility: "Visibilité mondiale",
    operations: "Intelligence opérationnelle",
    footer: "Tous droits réservés.",
    parcel: "Colis",
    freight: "Fret",
    cargo: "Cargaison",
    vehicle: "Véhicule",
  },

  es: {
    intelligence: "LOGÍSTICA GLOBAL",
    platform: "PLATAFORMA INTELIGENTE",
    trackAnother: "Rastrear otro envío",
    breadcrumb: "Seguimiento del envío",
    shipmentOverview: "RESUMEN DEL ENVÍO",
    latestMovement: "ÚLTIMO MOVIMIENTO",
    origin: "ORIGEN",
    destination: "DESTINO",
    shipmentType: "TIPO DE ENVÍO",
    estimatedArrival: "LLEGADA ESTIMADA",
    deliveryStatus: "ESTADO DE ENTREGA",
    currentStatus: "Estado actual",
    estimatedDelivery: "Entrega estimada",
    shipmentWeight: "Peso del envío",
    declaredValue: "Valor declarado",
    notProvided: "No proporcionado",
    notAvailable: "No disponible",
    movementHistory: "HISTORIAL DE MOVIMIENTOS",
    timeline: "Cronología del envío",
    events: "eventos",
    latest: "ÚLTIMO",
    noEvents: "No hay eventos disponibles",
    noEventsDescription: "Los eventos aparecerán aquí cuando haya actualizaciones.",
    shipmentProfile: "PERFIL DEL ENVÍO",
    shipmentDetails: "Detalles del envío",
    reference: "Referencia",
    type: "Tipo",
    weight: "Peso",
    customsOperations: "OPERACIONES TRANSFRONTERIZAS",
    customs: "Aduanas",
    requiredAction: "Acción requerida",
    shipmentRequirement: "REQUISITO DEL ENVÍO",
    paymentRequired: "Pago requerido",
    amountDue: "Importe pendiente",
    due: "Vencimiento",
    shipmentLookup: "BÚSQUEDA DE ENVÍO",
    unavailable: "Envío no disponible",
    tryAgain: "Probar otra referencia",
    noReference: "No se proporcionó ninguna referencia.",
    notFound: "No encontramos ningún envío asociado a esta referencia.",
    retrievalError: "No podemos recuperar la información del envío ahora.",
    generalError: "Se produjo un error al recuperar el envío.",
    loading: "CARGANDO ENVÍO",
    secure: "Seguimiento seguro",
    visibility: "Visibilidad global",
    operations: "Inteligencia operativa",
    footer: "Todos los derechos reservados.",
    parcel: "Paquete",
    freight: "Transporte",
    cargo: "Carga",
    vehicle: "Vehículo",
  },

  de: {
    intelligence: "GLOBALE LOGISTIK",
    platform: "INTELLIGENZPLATTFORM",
    trackAnother: "Weitere Sendung verfolgen",
    breadcrumb: "Sendungsverfolgung",
    shipmentOverview: "SENDUNGSÜBERSICHT",
    latestMovement: "LETZTE BEWEGUNG",
    origin: "URSPRUNG",
    destination: "ZIEL",
    shipmentType: "SENDUNGSTYP",
    estimatedArrival: "VORAUSSICHTLICHE ANKUNFT",
    deliveryStatus: "LIEFERSTATUS",
    currentStatus: "Aktueller Status",
    estimatedDelivery: "Voraussichtliche Lieferung",
    shipmentWeight: "Sendungsgewicht",
    declaredValue: "Deklarierter Wert",
    notProvided: "Nicht angegeben",
    notAvailable: "Nicht verfügbar",
    movementHistory: "SENDUNGSVERLAUF",
    timeline: "Sendungszeitachse",
    events: "Ereignisse",
    latest: "AKTUELL",
    noEvents: "Keine Bewegungsereignisse verfügbar",
    noEventsDescription: "Sendungsereignisse erscheinen hier, sobald Aktualisierungen verfügbar sind.",
    shipmentProfile: "SENDUNGSPROFIL",
    shipmentDetails: "Sendungsdetails",
    reference: "Referenz",
    type: "Typ",
    weight: "Gewicht",
    customsOperations: "GRENZÜBERSCHREITENDE OPERATIONEN",
    customs: "Zoll",
    requiredAction: "Erforderliche Aktion",
    shipmentRequirement: "SENDUNGSANFORDERUNG",
    paymentRequired: "Zahlung erforderlich",
    amountDue: "Fälliger Betrag",
    due: "Fällig",
    shipmentLookup: "SENDUNGSSUCHE",
    unavailable: "Sendung nicht verfügbar",
    tryAgain: "Andere Referenz versuchen",
    noReference: "Keine Sendungsreferenz angegeben.",
    notFound: "Zu dieser Referenz wurde keine Sendung gefunden.",
    retrievalError: "Sendungsinformationen konnten nicht abgerufen werden.",
    generalError: "Beim Abrufen der Sendung ist ein Fehler aufgetreten.",
    loading: "SENDUNG WIRD GELADEN",
    secure: "Sichere Sendungsverfolgung",
    visibility: "Globale Transparenz",
    operations: "Operative Intelligenz",
    footer: "Alle Rechte vorbehalten.",
    parcel: "Paket",
    freight: "Fracht",
    cargo: "Ladung",
    vehicle: "Fahrzeug",
  },

  ar: {
    intelligence: "الخدمات اللوجستية العالمية",
    platform: "منصة المعلومات الذكية",
    trackAnother: "تتبع شحنة أخرى",
    breadcrumb: "تتبع الشحنة",
    shipmentOverview: "نظرة عامة على الشحنة",
    latestMovement: "آخر حركة",
    origin: "نقطة الانطلاق",
    destination: "الوجهة",
    shipmentType: "نوع الشحنة",
    estimatedArrival: "الوصول المتوقع",
    deliveryStatus: "حالة التسليم",
    currentStatus: "الحالة الحالية",
    estimatedDelivery: "التسليم المتوقع",
    shipmentWeight: "وزن الشحنة",
    declaredValue: "القيمة المعلنة",
    notProvided: "غير متوفر",
    notAvailable: "غير متاح",
    movementHistory: "سجل حركة الشحنة",
    timeline: "الجدول الزمني للشحنة",
    events: "أحداث",
    latest: "الأحدث",
    noEvents: "لا توجد أحداث متاحة",
    noEventsDescription: "ستظهر أحداث الشحنة هنا عند توفر التحديثات.",
    shipmentProfile: "ملف الشحنة",
    shipmentDetails: "تفاصيل الشحنة",
    reference: "المرجع",
    type: "النوع",
    weight: "الوزن",
    customsOperations: "العمليات عبر الحدود",
    customs: "الجمارك",
    requiredAction: "الإجراء المطلوب",
    shipmentRequirement: "متطلبات الشحنة",
    paymentRequired: "الدفع مطلوب",
    amountDue: "المبلغ المستحق",
    due: "تاريخ الاستحقاق",
    shipmentLookup: "البحث عن الشحنة",
    unavailable: "الشحنة غير متاحة",
    tryAgain: "جرب مرجعاً آخر",
    noReference: "لم يتم تقديم رقم تتبع.",
    notFound: "لم نتمكن من العثور على شحنة مرتبطة بهذا الرقم.",
    retrievalError: "تعذر استرداد معلومات الشحنة حالياً.",
    generalError: "حدث خطأ أثناء استرداد معلومات الشحنة.",
    loading: "جارٍ تحميل الشحنة",
    secure: "تتبع آمن",
    visibility: "رؤية عالمية",
    operations: "ذكاء تشغيلي",
    footer: "جميع الحقوق محفوظة.",
    parcel: "طرد",
    freight: "شحن",
    cargo: "بضائع",
    vehicle: "مركبة",
  },

  zh: {
    intelligence: "全球物流",
    platform: "智能运营平台",
    trackAnother: "追踪另一件货物",
    breadcrumb: "货物追踪",
    shipmentOverview: "货物概览",
    latestMovement: "最新动态",
    origin: "起运地",
    destination: "目的地",
    shipmentType: "货物类型",
    estimatedArrival: "预计到达",
    deliveryStatus: "配送状态",
    currentStatus: "当前状态",
    estimatedDelivery: "预计送达",
    shipmentWeight: "货物重量",
    declaredValue: "申报价值",
    notProvided: "未提供",
    notAvailable: "不可用",
    movementHistory: "运输动态",
    timeline: "货物运输时间线",
    events: "条记录",
    latest: "最新",
    noEvents: "暂无运输动态",
    noEventsDescription: "有新的运营更新时，货物动态将在此显示。",
    shipmentProfile: "货物资料",
    shipmentDetails: "货物详情",
    reference: "参考编号",
    type: "类型",
    weight: "重量",
    customsOperations: "跨境运营",
    customs: "海关",
    requiredAction: "所需操作",
    shipmentRequirement: "货物要求",
    paymentRequired: "需要付款",
    amountDue: "应付金额",
    due: "截止日期",
    shipmentLookup: "货物查询",
    unavailable: "货物暂不可用",
    tryAgain: "尝试其他编号",
    noReference: "未提供追踪编号。",
    notFound: "找不到与此追踪编号相关的货物。",
    retrievalError: "目前无法获取货物信息。",
    generalError: "获取货物信息时发生错误。",
    loading: "正在加载货物",
    secure: "安全追踪",
    visibility: "全球可视化",
    operations: "运营智能",
    footer: "版权所有。",
    parcel: "包裹",
    freight: "货运",
    cargo: "货物",
    vehicle: "车辆",
  },

  ru: {
    intelligence: "ГЛОБАЛЬНАЯ ЛОГИСТИКА",
    platform: "ИНТЕЛЛЕКТУАЛЬНАЯ ПЛАТФОРМА",
    trackAnother: "Отследить другую отправку",
    breadcrumb: "Отслеживание отправления",
    shipmentOverview: "ОБЗОР ОТПРАВЛЕНИЯ",
    latestMovement: "ПОСЛЕДНЕЕ ПЕРЕМЕЩЕНИЕ",
    origin: "ОТПРАВЛЕНИЕ",
    destination: "НАЗНАЧЕНИЕ",
    shipmentType: "ТИП ОТПРАВЛЕНИЯ",
    estimatedArrival: "ОЖИДАЕМОЕ ПРИБЫТИЕ",
    deliveryStatus: "СТАТУС ДОСТАВКИ",
    currentStatus: "Текущий статус",
    estimatedDelivery: "Ожидаемая доставка",
    shipmentWeight: "Вес отправления",
    declaredValue: "Заявленная стоимость",
    notProvided: "Не указано",
    notAvailable: "Недоступно",
    movementHistory: "ИСТОРИЯ ПЕРЕМЕЩЕНИЙ",
    timeline: "Хронология отправления",
    events: "событий",
    latest: "ПОСЛЕДНЕЕ",
    noEvents: "Нет доступных событий",
    noEventsDescription: "Здесь появятся обновления о перемещении отправления.",
    shipmentProfile: "ПРОФИЛЬ ОТПРАВЛЕНИЯ",
    shipmentDetails: "Детали отправления",
    reference: "Номер",
    type: "Тип",
    weight: "Вес",
    customsOperations: "ТРАНСГРАНИЧНЫЕ ОПЕРАЦИИ",
    customs: "Таможня",
    requiredAction: "Требуемое действие",
    shipmentRequirement: "ТРЕБОВАНИЕ К ОТПРАВЛЕНИЮ",
    paymentRequired: "Требуется оплата",
    amountDue: "Сумма к оплате",
    due: "Срок оплаты",
    shipmentLookup: "ПОИСК ОТПРАВЛЕНИЯ",
    unavailable: "Отправление недоступно",
    tryAgain: "Попробовать другой номер",
    noReference: "Номер отслеживания не указан.",
    notFound: "Отправление с таким номером не найдено.",
    retrievalError: "Не удалось получить информацию об отправлении.",
    generalError: "При получении информации произошла ошибка.",
    loading: "ЗАГРУЗКА ОТПРАВЛЕНИЯ",
    secure: "Безопасное отслеживание",
    visibility: "Глобальная видимость",
    operations: "Операционная аналитика",
    footer: "Все права защищены.",
    parcel: "Посылка",
    freight: "Грузоперевозка",
    cargo: "Груз",
    vehicle: "Транспорт",
  },

  pt: {
    intelligence: "LOGÍSTICA GLOBAL",
    platform: "PLATAFORMA INTELIGENTE",
    trackAnother: "Rastrear outra encomenda",
    breadcrumb: "Rastreamento de envio",
    shipmentOverview: "VISÃO GERAL DO ENVIO",
    latestMovement: "MOVIMENTO MAIS RECENTE",
    origin: "ORIGEM",
    destination: "DESTINO",
    shipmentType: "TIPO DE ENVIO",
    estimatedArrival: "CHEGADA ESTIMADA",
    deliveryStatus: "ESTADO DA ENTREGA",
    currentStatus: "Estado atual",
    estimatedDelivery: "Entrega estimada",
    shipmentWeight: "Peso do envio",
    declaredValue: "Valor declarado",
    notProvided: "Não fornecido",
    notAvailable: "Não disponível",
    movementHistory: "HISTÓRICO DE MOVIMENTOS",
    timeline: "Cronologia do envio",
    events: "eventos",
    latest: "MAIS RECENTE",
    noEvents: "Não existem eventos disponíveis",
    noEventsDescription: "Os eventos aparecerão aqui quando houver atualizações.",
    shipmentProfile: "PERFIL DO ENVIO",
    shipmentDetails: "Detalhes do envio",
    reference: "Referência",
    type: "Tipo",
    weight: "Peso",
    customsOperations: "OPERAÇÕES TRANSFRONTEIRIÇAS",
    customs: "Alfândega",
    requiredAction: "Ação necessária",
    shipmentRequirement: "REQUISITO DO ENVIO",
    paymentRequired: "Pagamento necessário",
    amountDue: "Valor devido",
    due: "Vencimento",
    shipmentLookup: "PESQUISA DE ENVIO",
    unavailable: "Envio indisponível",
    tryAgain: "Tentar outra referência",
    noReference: "Nenhuma referência de rastreamento fornecida.",
    notFound: "Não encontrámos um envio associado a esta referência.",
    retrievalError: "Não foi possível obter as informações do envio.",
    generalError: "Ocorreu um erro ao obter as informações.",
    loading: "A CARREGAR ENVIO",
    secure: "Rastreamento seguro",
    visibility: "Visibilidade global",
    operations: "Inteligência operacional",
    footer: "Todos os direitos reservados.",
    parcel: "Encomenda",
    freight: "Frete",
    cargo: "Carga",
    vehicle: "Veículo",
  },

  uk: {
    intelligence: "ГЛОБАЛЬНА ЛОГІСТИКА",
    platform: "ІНТЕЛЕКТУАЛЬНА ПЛАТФОРМА",
    trackAnother: "Відстежити інше відправлення",
    breadcrumb: "Відстеження відправлення",
    shipmentOverview: "ОГЛЯД ВІДПРАВЛЕННЯ",
    latestMovement: "ОСТАННЄ ПЕРЕМІЩЕННЯ",
    origin: "ВІДПРАВЛЕННЯ",
    destination: "ПРИЗНАЧЕННЯ",
    shipmentType: "ТИП ВІДПРАВЛЕННЯ",
    estimatedArrival: "ОЧІКУВАНЕ ПРИБУТТЯ",
    deliveryStatus: "СТАТУС ДОСТАВКИ",
    currentStatus: "Поточний статус",
    estimatedDelivery: "Очікувана доставка",
    shipmentWeight: "Вага відправлення",
    declaredValue: "Заявлена вартість",
    notProvided: "Не вказано",
    notAvailable: "Недоступно",
    movementHistory: "ІСТОРІЯ ПЕРЕМІЩЕНЬ",
    timeline: "Хронологія відправлення",
    events: "подій",
    latest: "ОСТАННЄ",
    noEvents: "Немає доступних подій",
    noEventsDescription: "Тут з'являтимуться оновлення про переміщення відправлення.",
    shipmentProfile: "ПРОФІЛЬ ВІДПРАВЛЕННЯ",
    shipmentDetails: "Деталі відправлення",
    reference: "Номер",
    type: "Тип",
    weight: "Вага",
    customsOperations: "ТРАНСКОРДОННІ ОПЕРАЦІЇ",
    customs: "Митниця",
    requiredAction: "Необхідна дія",
    shipmentRequirement: "ВИМОГА ДО ВІДПРАВЛЕННЯ",
    paymentRequired: "Потрібна оплата",
    amountDue: "Сума до сплати",
    due: "Термін оплати",
    shipmentLookup: "ПОШУК ВІДПРАВЛЕННЯ",
    unavailable: "Відправлення недоступне",
    tryAgain: "Спробувати інший номер",
    noReference: "Номер відстеження не вказано.",
    notFound: "Відправлення з таким номером не знайдено.",
    retrievalError: "Не вдалося отримати інформацію про відправлення.",
    generalError: "Під час отримання інформації сталася помилка.",
    loading: "ЗАВАНТАЖЕННЯ ВІДПРАВЛЕННЯ",
    secure: "Безпечне відстеження",
    visibility: "Глобальна видимість",
    operations: "Операційна аналітика",
    footer: "Усі права захищені.",
    parcel: "Посилка",
    freight: "Вантажоперевезення",
    cargo: "Вантаж",
    vehicle: "Транспорт",
  },
};

const localeMap: Record<string, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  de: "de-DE",
  ar: "ar",
  zh: "zh-CN",
  ru: "ru-RU",
  pt: "pt-PT",
  uk: "uk-UA",
};

function TrackPageContent() {
  const searchParams = useSearchParams();
  const trackingNumber = searchParams.get("tracking")?.trim() || "";
  const { language } = useLanguage();

  const t = (key: string) =>
    messages[language]?.[key] || messages.en[key] || key;

  const [shipment, setShipment] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function loadShipment(isRefresh = false) {
    if (!trackingNumber) {
      setIsLoading(false);
      setError(t("noReference"));
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/v1/tracking/${encodeURIComponent(trackingNumber)}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(t("notFound"));
        }

        throw new Error(t("retrievalError"));
      }

      const data: TrackingData = await response.json();
      setShipment(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : t("generalError")
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      if (!trackingNumber) {
        setIsLoading(false);
        setError(t("noReference"));
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/api/v1/tracking/${encodeURIComponent(trackingNumber)}`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(t("notFound"));
          }

          throw new Error(t("retrievalError"));
        }

        const data: TrackingData = await response.json();

        if (!cancelled) {
          setShipment(data);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : t("generalError")
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    initialLoad();

    return () => {
      cancelled = true;
    };
  }, [trackingNumber, language]);

  const isRTL = language === "ar";

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-[#f7f9fc] text-[#14243a]"
    >
      <header className="sticky top-0 z-40 border-b border-[#e7ecf2] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[78px] max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#14243a] text-white shadow-lg shadow-[#14243a]/10">
              <Globe2 size={23} strokeWidth={1.7} />
            </div>

            <div>
              <div className="text-[13px] font-extrabold tracking-[0.12em] text-[#14243a]">
                GLOBAL LOGISTICS
              </div>
              <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.24em] text-[#8290a3]">
                {t("platform")}
              </div>
            </div>
          </a>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <LanguageSelector />
            </div>

            <a
              href="/#tracking"
              className="hidden items-center gap-2 rounded-xl bg-[#2457d6] px-4 py-3 text-[11px] font-semibold text-white shadow-md shadow-blue-600/10 transition hover:bg-[#1949c5] sm:inline-flex"
            >
              {t("trackAnother")}
              {isRTL ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
            </a>
          </div>
        </div>

        <div className="border-t border-[#e7ecf2] px-5 py-2 sm:hidden">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between">
            <LanguageSelector />
            <a
              href="/#tracking"
              className="text-[11px] font-semibold text-[#2457d6]"
            >
              {t("trackAnother")}
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
        {isLoading ? (
          <LoadingState t={t} />
        ) : error ? (
          <ErrorState
            trackingNumber={trackingNumber}
            message={error}
            t={t}
          />
        ) : shipment ? (
          <ShipmentExperience
            shipment={shipment}
            t={t}
            language={language}
            onRefresh={() => loadShipment(true)}
            refreshing={refreshing}
          />
        ) : null}
      </div>

      <footer className="mt-12 border-t border-[#e7ecf2] bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-5 px-5 py-8 sm:px-8 md:flex-row lg:px-12">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#14243a] text-white">
              <Globe2 size={18} />
            </div>
            <div>
              <div className="text-[10px] font-extrabold tracking-[0.12em]">
                GLOBAL LOGISTICS
              </div>
              <div className="mt-1 text-[9px] text-[#8b98a9]">
                © {new Date().getFullYear()} {t("footer")}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-[10px] font-medium text-[#8390a2]">
            <span className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-[#15966b]" />
              {t("secure")}
            </span>
            <span className="flex items-center gap-2">
              <Globe2 size={14} className="text-[#2457d6]" />
              {t("visibility")}
            </span>
            <span className="flex items-center gap-2">
              <Package size={14} className="text-[#16a6a1]" />
              {t("operations")}
            </span>
          </div>
        </div>
      </footer>

      {shipment && !isLoading && !error ? (
        <AssistantWidget
          context="tracking"
          trackingNumber={shipment.tracking_number}
          language={language}
        />
      ) : null}
    </main>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f7f9fc]">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-[3px] border-[#e7ecf2] border-t-[#2457d6]" />
            <p className="mt-5 text-[10px] font-bold tracking-[0.18em] text-[#8290a3]">
              LOADING SHIPMENT
            </p>
          </div>
        </main>
      }
    >
      <TrackPageContent />
    </Suspense>
  );
}

function ShipmentExperience({
  shipment,
  t,
  language,
  onRefresh,
  refreshing,
}: {
  shipment: TrackingData;
  t: (key: string) => string;
  language: string;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const events = useMemo(
    () =>
      [...shipment.tracking_events].sort(
        (a, b) =>
          new Date(b.event_time).getTime() -
          new Date(a.event_time).getTime()
      ),
    [shipment.tracking_events]
  );

  const latestEvent = events[0];

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium text-[#91a0b2]">
          <a href="/" className="transition hover:text-[#2457d6]">
            GLOBAL LOGISTICS
          </a>
          <span>/</span>
          <span>{t("breadcrumb")}</span>
          <span>/</span>
          <span className="font-semibold text-[#53647a]">
            {shipment.tracking_number}
          </span>
        </div>

        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-[#e1e7ef] bg-white px-4 py-2.5 text-[10px] font-semibold text-[#52647a] shadow-sm transition hover:border-[#2457d6]/30 hover:text-[#2457d6] disabled:opacity-50"
        >
          <RefreshCw
            size={13}
            className={refreshing ? "animate-spin" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh tracking"}
        </button>
      </div>

      <section className="overflow-hidden rounded-[26px] border border-[#e6ebf2] bg-white shadow-[0_12px_50px_rgba(20,36,58,0.045)]">
        <div className="relative overflow-hidden px-6 py-8 sm:px-9 sm:py-10 lg:px-11">
          <div className="pointer-events-none absolute right-[-80px] top-[-160px] h-[350px] w-[350px] rounded-full bg-[#2457d6]/[0.035] blur-[80px]" />

          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-start">
            <div className="min-w-0">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#e7ecf2] bg-[#f7f9fc] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.13em] text-[#6d7c90]">
                  <Package size={12} />
                  {translateType(shipment.shipment_type, t)}
                </span>

                <StatusBadge status={shipment.status} t={t} />
              </div>

              <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#93a0b1]">
                {t("shipmentOverview")}
              </div>

              <h1 className="mt-3 break-all text-3xl font-extrabold tracking-[-0.045em] text-[#14243a] sm:text-4xl lg:text-[46px]">
                {shipment.tracking_number}
              </h1>

              <p className="mt-4 max-w-2xl text-[13px] leading-7 text-[#8290a3]">
                {shipment.description ||
                  "Shipment movement and operational information."}
              </p>
            </div>

            <div className="min-w-[220px] rounded-2xl border border-[#e8edf4] bg-[#f9fbfd] p-5 lg:mt-7">
              <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[#92a0b1]">
                <span className="h-2 w-2 rounded-full bg-[#16a6a1]" />
                {t("latestMovement")}
              </div>

              <div className="mt-4 text-sm font-bold leading-6 text-[#263951]">
                {latestEvent?.title || formatStatus(shipment.status, t)}
              </div>

              {latestEvent?.location && (
                <div className="mt-2 flex items-center gap-2 text-[11px] text-[#8391a3]">
                  <MapPin size={13} className="shrink-0 text-[#2457d6]" />
                  {latestEvent.location}
                </div>
              )}

              {latestEvent && (
                <div className="mt-4 border-t border-[#e7ecf2] pt-3 text-[10px] text-[#9aa6b5]">
                  {formatEventDate(latestEvent.event_time, language)}
                </div>
              )}
            </div>
          </div>
        </div>

        <RoutePanel shipment={shipment} t={t} language={language} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <IntelligenceCard
          label={t("currentStatus")}
          value={formatStatus(shipment.status, t)}
          icon={<Package size={19} />}
          accent="blue"
        />

        <IntelligenceCard
          label={t("estimatedDelivery")}
          value={formatDate(shipment.estimated_delivery_at, language, t)}
          icon={<CalendarDays size={19} />}
          accent="teal"
        />

        <IntelligenceCard
          label={t("shipmentWeight")}
          value={
            shipment.weight_kg !== null &&
            shipment.weight_kg !== undefined
              ? `${shipment.weight_kg} kg`
              : t("notProvided")
          }
          icon={<Weight size={19} />}
          accent="violet"
        />

        <IntelligenceCard
          label={t("declaredValue")}
          value={
            shipment.declared_value !== null &&
            shipment.declared_value !== undefined
              ? `${shipment.declared_currency || ""} ${shipment.declared_value}`
              : t("notProvided")
          }
          icon={<CircleDollarSign size={19} />}
          accent="green"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="overflow-hidden rounded-[24px] border border-[#e6ebf2] bg-white shadow-[0_8px_35px_rgba(20,36,58,0.035)]">
          <div className="flex items-center justify-between gap-4 border-b border-[#edf0f5] px-6 py-6 sm:px-8">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#93a0b1]">
                {t("movementHistory")}
              </div>
              <h2 className="mt-2 text-lg font-bold tracking-[-0.025em] text-[#14243a]">
                {t("timeline")}
              </h2>
            </div>

            <div className="rounded-full border border-[#e6ebf2] bg-[#f7f9fc] px-3 py-2 text-[9px] font-bold text-[#718198]">
              {events.length} {t("events")}
            </div>
          </div>

          <div className="px-6 py-8 sm:px-8">
            {events.length > 0 ? (
              <TrackingTimeline
                events={events}
                t={t}
                language={language}
              />
            ) : (
              <EmptyTimeline t={t} />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <ShipmentDetails
            shipment={shipment}
            t={t}
          />

          {shipment.customs && (
            <CustomsCard customs={shipment.customs} t={t} />
          )}

          {shipment.payment_required && (
            <PaymentCard
              payment={shipment.payment_required}
              t={t}
              language={language}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function RoutePanel({
  shipment,
  t,
  language,
}: {
  shipment: TrackingData;
  t: (key: string) => string;
  language: string;
}) {
  const origin = shipment.origin_city
    ? `${shipment.origin_city}, ${shipment.origin_country}`
    : shipment.origin_country;

  const destination = shipment.destination_city
    ? `${shipment.destination_city}, ${shipment.destination_country}`
    : shipment.destination_country;

  return (
    <div className="border-t border-[#edf0f5] bg-[#fbfcfe] px-6 py-8 sm:px-9 lg:px-11 lg:py-9">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <RouteLocation
          eyebrow={t("origin")}
          location={origin}
          icon={<ArrowUpRight size={18} />}
        />

        <div className="relative hidden min-w-[260px] lg:block">
          <div className="h-[2px] w-full bg-gradient-to-r from-[#2457d6]/20 via-[#16a6a1]/60 to-[#2457d6]/20" />

          <div className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-[3px] border-white bg-[#2457d6] shadow-sm" />

          <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#dce7fb] bg-white text-[#2457d6] shadow-lg shadow-blue-900/5">
            <Plane size={19} strokeWidth={1.7} />
          </div>

          <div className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-[3px] border-white bg-[#16a6a1] shadow-sm" />
        </div>

        <RouteLocation
          eyebrow={t("destination")}
          location={destination}
          icon={<MapPin size={18} />}
          align="right"
        />
      </div>

      <div className="mt-8 grid gap-3 border-t border-[#e9edf3] pt-6 sm:grid-cols-3">
        <RouteMeta
          label={t("shipmentType")}
          value={translateType(shipment.shipment_type, t)}
          icon={<Box size={15} />}
        />

        <RouteMeta
          label={t("estimatedArrival")}
          value={formatDate(shipment.estimated_delivery_at, language, t)}
          icon={<CalendarDays size={15} />}
        />

        <RouteMeta
          label={t("deliveryStatus")}
          value={formatStatus(shipment.status, t)}
          icon={<Truck size={15} />}
        />
      </div>
    </div>
  );
}

function RouteLocation({
  eyebrow,
  location,
  icon,
  align,
}: {
  eyebrow: string;
  location: string;
  icon: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "lg:text-right" : ""}>
      <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#93a0b1]">
        {icon}
        {eyebrow}
      </div>

      <div className="mt-3 text-xl font-bold tracking-[-0.035em] text-[#20334b]">
        {location}
      </div>
    </div>
  );
}

function RouteMeta({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#e9edf3] bg-white px-4 py-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0f5ff] text-[#2457d6]">
        {icon}
      </div>

      <div className="min-w-0">
        <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#99a5b4]">
          {label}
        </div>
        <div className="mt-2 truncate text-xs font-semibold text-[#52647a]">
          {value}
        </div>
      </div>
    </div>
  );
}

function IntelligenceCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: "blue" | "teal" | "violet" | "green";
}) {
  const accents = {
    blue: "bg-[#eef3ff] text-[#2457d6]",
    teal: "bg-[#eaf8f7] text-[#16a6a1]",
    violet: "bg-[#f3efff] text-[#8261ce]",
    green: "bg-[#eaf7f0] text-[#15966b]",
  };

  return (
    <div className="rounded-2xl border border-[#e6ebf2] bg-white p-5 shadow-[0_5px_22px_rgba(20,36,58,0.025)] transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#8d9aab]">
          {label}
        </span>

        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accents[accent]}`}>
          {icon}
        </span>
      </div>

      <div className="mt-6 truncate text-[14px] font-bold text-[#263951]">
        {value}
      </div>
    </div>
  );
}

function ShipmentDetails({
  shipment,
  t,
}: {
  shipment: TrackingData;
  t: (key: string) => string;
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[#e6ebf2] bg-white shadow-[0_8px_35px_rgba(20,36,58,0.035)]">
      <div className="border-b border-[#edf0f5] px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef3ff] text-[#2457d6]">
            <FileText size={19} />
          </div>

          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#93a0b1]">
              {t("shipmentProfile")}
            </div>
            <h2 className="mt-1 text-base font-bold text-[#14243a]">
              {t("shipmentDetails")}
            </h2>
          </div>
        </div>
      </div>

      <div className="divide-y divide-[#edf0f5] px-6">
        <DetailRow
          label={t("reference")}
          value={shipment.tracking_number}
        />

        <DetailRow
          label={t("type")}
          value={translateType(shipment.shipment_type, t)}
        />

        <DetailRow
          label={t("origin")}
          value={
            shipment.origin_city
              ? `${shipment.origin_city}, ${shipment.origin_country}`
              : shipment.origin_country
          }
        />

        <DetailRow
          label={t("destination")}
          value={
            shipment.destination_city
              ? `${shipment.destination_city}, ${shipment.destination_country}`
              : shipment.destination_country
          }
        />

        <DetailRow
          label={t("weight")}
          value={
            shipment.weight_kg !== null &&
            shipment.weight_kg !== undefined
              ? `${shipment.weight_kg} kg`
              : t("notProvided")
          }
        />

        <DetailRow
          label={t("declaredValue")}
          value={
            shipment.declared_value !== null &&
            shipment.declared_value !== undefined
              ? `${shipment.declared_currency || ""} ${shipment.declared_value}`
              : t("notProvided")
          }
        />
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-5 py-4">
      <span className="text-[10px] font-medium text-[#91a0b2]">
        {label}
      </span>

      <span className="max-w-[65%] break-words text-right text-xs font-semibold text-[#52647a]">
        {value}
      </span>
    </div>
  );
}

function TrackingTimeline({
  events,
  t,
  language,
}: {
  events: TrackingEvent[];
  t: (key: string) => string;
  language: string;
}) {
  return (
    <div className="relative">
      <div className="absolute bottom-5 left-[8px] top-5 w-[2px] bg-gradient-to-b from-[#2457d6]/40 via-[#dce5f2] to-transparent" />

      <div className="space-y-9">
        {events.map((event, index) => {
          const isLatest = index === 0;

          return (
            <div
              key={`${event.event_time}-${event.title}-${index}`}
              className="relative pl-9"
            >
              <div
                className={[
                  "absolute left-0 top-1 flex h-[17px] w-[17px] items-center justify-center rounded-full border-[3px] border-white",
                  isLatest
                    ? "bg-[#2457d6] shadow-[0_0_0_4px_rgba(36,87,214,0.12)]"
                    : "bg-[#c6d0dd] shadow-[0_0_0_3px_rgba(198,208,221,0.15)]",
                ].join(" ")}
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold leading-6 text-[#263951]">
                      {event.title}
                    </h3>

                    {isLatest && (
                      <span className="rounded-full bg-[#eef3ff] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-[#2457d6]">
                        {t("latest")}
                      </span>
                    )}
                  </div>

                  {event.description && (
                    <p className="mt-2 max-w-xl text-xs leading-6 text-[#8492a4]">
                      {event.description}
                    </p>
                  )}

                  {(event.location || event.country_code) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {event.location && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8edf3] bg-[#f8fafc] px-2.5 py-1.5 text-[9px] font-medium text-[#718198]">
                          <MapPin size={11} />
                          {event.location}
                        </span>
                      )}

                      {event.country_code && (
                        <span className="rounded-lg border border-[#e8edf3] bg-[#f8fafc] px-2.5 py-1.5 text-[9px] font-semibold text-[#718198]">
                          {event.country_code}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <time className="shrink-0 text-[10px] font-medium text-[#9aa6b5] sm:text-right">
                  {formatEventDate(event.event_time, language)}
                </time>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CustomsCard({
  customs,
  t,
}: {
  customs: CustomsStatus;
  t: (key: string) => string;
}) {
  const status = formatStatus(customs.status, t);

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#f0e6ce] bg-white shadow-[0_8px_35px_rgba(20,36,58,0.025)]">
      <div className="border-b border-[#f1eadb] bg-[#fffcf5] px-6 py-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff2d9] text-[#b77b1d]">
              <ShieldCheck size={19} />
            </div>

            <div>
              <div className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#b79b6b]">
                {t("customsOperations")}
              </div>
              <h2 className="mt-1 text-base font-bold text-[#263951]">
                {t("customs")}
              </h2>
            </div>
          </div>

          <span className="rounded-full border border-[#f0e1c0] bg-white px-3 py-1.5 text-[9px] font-bold text-[#a8792d]">
            {status}
          </span>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        <DetailRow label={t("currentStatus")} value={status} />

        {customs.customs_reference && (
          <DetailRow
            label={t("reference")}
            value={customs.customs_reference}
          />
        )}

        {customs.required_action && (
          <div className="rounded-xl border border-[#f0e6ce] bg-[#fffcf6] p-4">
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#a77a32]">
              <AlertCircle size={13} />
              {t("requiredAction")}
            </div>

            <p className="mt-3 text-xs leading-6 text-[#7e6a49]">
              {customs.required_action}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentCard({
  payment,
  t,
  language,
}: {
  payment: PaymentRequirement;
  t: (key: string) => string;
  language: string;
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[#dfe8fa] bg-white shadow-[0_8px_35px_rgba(20,36,58,0.025)]">
      <div className="border-b border-[#e8eef9] bg-[#f5f8ff] px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6edff] text-[#2457d6]">
            <CircleDollarSign size={20} />
          </div>

          <div>
            <div className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#8197c3]">
              {t("shipmentRequirement")}
            </div>
            <h2 className="mt-1 text-base font-bold text-[#263951]">
              {t("paymentRequired")}
            </h2>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-6 py-6">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#91a0b2]">
            {t("amountDue")}
          </div>

          <div className="mt-2 text-3xl font-extrabold tracking-[-0.04em] text-[#14243a]">
            {payment.currency} {payment.amount}
          </div>
        </div>

        <p className="text-xs leading-6 text-[#8290a3]">
          {payment.description}
        </p>

        <div className="rounded-xl border border-[#e8edf5] bg-[#f9fbff] p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#91a0b2]">
              {t("reference")}
            </span>

            <span className="break-all text-xs font-semibold text-[#52647a]">
              {payment.reference}
            </span>
          </div>

          {payment.due_at && (
            <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#e8edf5] pt-3">
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#91a0b2]">
                {t("due")}
              </span>

              <span className="text-xs font-medium text-[#52647a]">
                {formatDate(payment.due_at, language, t)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  t,
}: {
  status: string;
  t: (key: string) => string;
}) {
  const normalized = status.toLowerCase();

  const completed = [
    "delivered",
    "return_delivered",
    "customs_cleared",
    "released_from_customs",
  ];

  const exceptions = [
    "pickup_failed",
    "delivery_attempted",
    "delivery_failed",
    "damaged",
    "lost",
    "cancelled",
    "on_hold",
    "customs_hold",
  ];

  const customs = [
    "customs_clearance",
    "customs_inspection",
  ];

  let classes = "border-[#e3e9f1] bg-[#f5f7fa] text-[#6e7d91]";
  let dot = "bg-[#8b9aab]";

  if (completed.includes(normalized)) {
    classes = "border-[#ccebdc] bg-[#effaf4] text-[#16845d]";
    dot = "bg-[#15966b]";
  } else if (exceptions.includes(normalized)) {
    classes = "border-[#f1dfbd] bg-[#fff9ed] text-[#a8792d]";
    dot = "bg-[#d49b39]";
  } else if (customs.includes(normalized)) {
    classes = "border-[#e4dafa] bg-[#f7f2ff] text-[#8058b9]";
    dot = "bg-[#8961c5]";
  } else if (
    [
      "picked_up",
      "received",
      "processing",
      "departed_facility",
      "in_transit",
      "arrived_at_facility",
      "arrived_at_destination",
      "out_for_delivery",
      "ready_for_collection",
      "waiting_for_pickup",
      "pickup_scheduled",
    ].includes(normalized)
  ) {
    classes = "border-[#d7e4ff] bg-[#f0f5ff] text-[#2457d6]";
    dot = "bg-[#2457d6]";
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] ${classes}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {formatStatus(status, t)}
    </span>
  );
}

function LoadingState({
  t,
}: {
  t: (key: string) => string;
}) {
  return (
    <div className="flex min-h-[620px] items-center justify-center">
      <div className="w-full max-w-3xl">
        <div className="mb-6 h-3 w-32 animate-pulse rounded-full bg-[#e7ecf2]" />
        <div className="h-12 w-2/3 animate-pulse rounded-xl bg-[#e7ecf2]" />
        <div className="mt-4 h-5 w-1/2 animate-pulse rounded-full bg-[#edf1f6]" />

        <div className="mt-10 h-64 animate-pulse rounded-[26px] border border-[#e7ecf2] bg-white" />

        <div className="mt-5 grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-2xl border border-[#e7ecf2] bg-white"
            />
          ))}
        </div>

        <p className="mt-8 text-center text-[10px] font-bold tracking-[0.17em] text-[#91a0b2]">
          {t("loading")}
        </p>
      </div>
    </div>
  );
}

function ErrorState({
  trackingNumber,
  message,
  t,
}: {
  trackingNumber: string;
  message: string;
  t: (key: string) => string;
}) {
  return (
    <div className="flex min-h-[620px] items-center justify-center">
      <div className="w-full max-w-xl rounded-[26px] border border-[#e6ebf2] bg-white p-8 text-center shadow-[0_15px_55px_rgba(20,36,58,0.06)] sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#f4dfdf] bg-[#fff5f5] text-[#d45c5c]">
          <AlertCircle size={27} />
        </div>

        <div className="mt-7 text-[9px] font-bold uppercase tracking-[0.2em] text-[#93a0b1]">
          {t("shipmentLookup")}
        </div>

        <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.035em] text-[#14243a]">
          {t("unavailable")}
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#8290a3]">
          {message}
        </p>

        {trackingNumber && (
          <div className="mx-auto mt-6 max-w-sm rounded-xl border border-[#e7ecf2] bg-[#f8fafc] px-4 py-4">
            <div className="text-[8px] font-bold uppercase tracking-[0.17em] text-[#99a5b4]">
              {t("reference")}
            </div>

            <div className="mt-2 break-all text-xs font-bold text-[#52647a]">
              {trackingNumber}
            </div>
          </div>
        )}

        <a
          href="/#tracking"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#2457d6] px-6 py-3.5 text-[11px] font-bold text-white shadow-lg shadow-blue-600/10 transition hover:bg-[#1949c5]"
        >
          <ArrowLeft size={14} />
          {t("tryAgain")}
        </a>
      </div>
    </div>
  );
}

function EmptyTimeline({
  t,
}: {
  t: (key: string) => string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#dfe6ef] bg-[#fafbfd] p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#9aa8b9] shadow-sm">
        <Clock3 size={22} />
      </div>

      <div className="mt-4 text-sm font-bold text-[#52647a]">
        {t("noEvents")}
      </div>

      <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-[#91a0b2]">
        {t("noEventsDescription")}
      </p>
    </div>
  );
}

function formatStatus(
  status: string,
  t: (key: string) => string
) {
  const normalized = status.toLowerCase();

  const translated = t(normalized);

  if (translated !== normalized) {
    return translated;
  }

  return normalized
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function translateType(
  type: string,
  t: (key: string) => string
) {
  const normalized = type.toLowerCase();
  const translated = t(normalized);

  if (translated !== normalized) {
    return translated;
  }

  return formatStatus(type, t);
}

function formatDate(
  value: string | null | undefined,
  language: string,
  t: (key: string) => string
) {
  if (!value) {
    return t("notAvailable");
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return t("notAvailable");
  }

  return new Intl.DateTimeFormat(localeMap[language] || "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatEventDate(value: string, language: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(localeMap[language] || "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}