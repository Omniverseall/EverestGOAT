import React from 'react';
import { X, Smartphone, Download, Wifi, ShieldCheck, CheckCircle2, ArrowRight, ExternalLink, HelpCircle } from 'lucide-react';

export default function SetupGuideModal({ isOpen, onClose, onOpenSettings }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Инструкция: Бесплатный Android SMS Шлюз</h2>
              <p className="text-xs text-slate-400">Как настроить отправку SMS через телефон учителя</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm text-slate-300">
          
          {/* Why free box */}
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 space-y-2">
            <div className="font-bold flex items-center gap-2 text-indigo-300">
              <ShieldCheck className="w-4 h-4" />
              <span>Почему это 100% бесплатно и без платных SMS-сервисов?</span>
            </div>
            <p className="text-xs leading-relaxed text-indigo-200/90">
              Сайт <strong>Goat</strong> передает текст по вашей локальной сети на бесплатное приложение в Android-телефоне, а телефон мгновенно отправляет реальное SMS через вашу обычную SIM-карту (расходуются бесплатные SMS вашего тарифного плана). Никаких подписок и сторонних агрегаторов!
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            
            {/* Step 1 */}
            <div className="flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-xs">
                1
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="font-bold text-white text-sm">
                  Скачайте приложение «Android SMS Gateway» на телефон
                </div>
                <p className="text-xs text-slate-400">
                  Мы рекомендуем надежное open-source приложение <strong>capcom6/android-sms-gateway</strong> (без рекламы, с открытым исходным кодом).
                </p>
                <div className="pt-1">
                  <a
                    href="https://github.com/capcom6/android-sms-gateway/releases/latest"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Скачать APK на телефон (GitHub Releases)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-xs">
                2
              </div>
              <div className="flex-1 space-y-1">
                <div className="font-bold text-white text-sm">
                  Установите APK и разрешите отправку SMS
                </div>
                <p className="text-xs text-slate-400">
                  При первом запуске Android запросит стандартные разрешения: «Разрешить отправку и просмотр SMS-сообщений». Нажмите <strong>«Разрешить»</strong>.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-xs">
                3
              </div>
              <div className="flex-1 space-y-2">
                <div className="font-bold text-white text-sm">
                  Включите «Локальный сервер» (Local Server)
                </div>
                <p className="text-xs text-slate-400">
                  В настройках приложения активируйте пункт <strong>«Local Server»</strong>. Задайте порт (по умолчанию <code className="text-indigo-300">8080</code>) и любые логин и пароль (например, <code className="text-indigo-300">sms</code> и <code className="text-indigo-300">1234</code>).
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-xs">
                4
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="font-bold text-white text-sm">
                  Подключите телефон и компьютер к одному Wi-Fi
                </div>
                <p className="text-xs text-slate-400">
                  В приложении на экране телефона появится его IP адрес, например: <code className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono text-xs">http://192.168.1.45:8080</code>.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-xs">
                5
              </div>
              <div className="flex-1 space-y-2">
                <div className="font-bold text-white text-sm">
                  Укажите этот IP в настройках сайта Goat
                </div>
                <p className="text-xs text-slate-400">
                  Откройте раздел «Настройки шлюза» в правом верхнем углу сайта, введите IP и нажмите «Проверить связь».
                </p>
              </div>
            </div>

          </div>

          {/* Alternative tip */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs space-y-1">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <span>💡 Если вы находитесь вне школы или без Wi-Fi:</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              В каждом окне отправки жалобы есть зеленая кнопка <strong>«WhatsApp (1 клик)»</strong>. Она мгновенно открывает переписку с родителем в WhatsApp с уже готовым текстом жалобы и фамилией ученика!
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/40 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
          >
            Понятно
          </button>
          <button
            onClick={() => {
              onClose();
              if (onOpenSettings) onOpenSettings();
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow transition"
          >
            <span>Перейти к настройкам шлюза</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
