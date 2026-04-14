import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Paperclip, Mic, Download, Settings, Play, Pause, MoreVertical } from 'lucide-react';

const MOCK_CONVERSATIONS = [
  { id: 'c1', contactName: 'Érica', contactPhone: '+55 84 9877-2098', time: '13:16', unread: 0, avatar: null, initials: 'ÉR', color: 'bg-emerald-500' },
  { id: 'c2', contactName: '.', contactPhone: '+55 81 7320-2734', time: '12:12', unread: 0, avatar: null, initials: '', color: 'bg-pink-500' },
  { id: 'c3', contactName: 'Matheus Rodrigues', contactPhone: '+55 84 8189-1997', time: '12:05', unread: 0, avatar: 'https://i.pravatar.cc/150?u=matheus', initials: 'MR', color: 'bg-brand-light' },
  { id: 'c4', contactName: '558499254197', contactPhone: '+55 84 9925-4197', time: '11:34', unread: 0, avatar: null, initials: 'SN', color: 'bg-green-500' },
];

const MOCK_MESSAGES = [
  { id: 'm1', sender: 'contact', text: 'Bairro: jardins/ cidade das rosas\nNa rua da creche nova geração', time: '10:44' },
  { id: 'm2', sender: 'vendor', text: 'Essa aqui te de pedi', time: '10:42' },
  { id: 'm3', sender: 'vendor', text: 'Certinho, ja te confirmo', time: '10:42' },
  { id: 'm4', sender: 'contact', type: 'audio', duration: '0:12', time: '10:44' },
  { id: 'm5', sender: 'contact', type: 'audio', duration: '0:08', time: '10:44' },
  { id: 'm6', sender: 'vendor', text: 'Ta joia, aguardo', time: '11:04' },
  { id: 'm7', sender: 'vendor', text: 'Foto ou pdf, os documentos', time: '11:05' },
  { id: 'm8', sender: 'vendor', type: 'audio', duration: '0:15', time: '11:19' },
  { id: 'm9', sender: 'contact', text: 'N consegui entender o áudio', time: '11:55' },
  { id: 'm10', sender: 'vendor', text: 'Eu pedi pra que a senhora me enviasse assim que possivel pois preciso para gerar a ordem de serviço e agendar a sua vistoria', time: '12:05' },
  { id: 'm11', sender: 'vendor', text: 'Fico no aguardo, dona Erika', time: '12:55' },
  { id: 'm12', sender: 'contact', text: 'O comprovante de residência só tenho como mandar quando chegar em casa a noite', time: '13:01' },
  { id: 'm13', sender: 'vendor', text: 'Se a senhora souber cep, nome de rua, numero e bairro da certo tambem viu', time: '13:06' },
  { id: 'm14', sender: 'contact', text: 'Rua dos amarilis 556\nBairro: jardins\nCep: 59293486\nNa rua da creche Nova Geração', time: '13:16' },
];

export default function ChatPage() {
  const { vendorId, conversationId } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');

  const currentConv = MOCK_CONVERSATIONS.find(c => c.id === conversationId) || MOCK_CONVERSATIONS[0];

  return (
    <div className="flex h-screen bg-surface text-primary overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r border-divider-subtle flex flex-col bg-surface">
        {/* Sidebar Header */}
        <div className="p-4 bg-surface-input flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-input rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src="https://i.pravatar.cc/150?u=joyce" alt="Vendor" className="w-8 h-8 rounded-full" />
            <div>
              <h2 className="text-sm font-semibold">Consultora Joyce</h2>
              <p className="text-xs text-muted">10 conversas</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 bg-surface border-b border-divider-subtle">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input 
              type="text" 
              placeholder="Pesquisar ou começar uma nova conversa" 
              className="w-full pl-10 pr-4 py-2 bg-surface-input rounded-lg text-sm focus:outline-none placeholder-muted"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide bg-surface">
          {MOCK_CONVERSATIONS.map((conv) => (
            <div 
              key={conv.id} 
              onClick={() => navigate(`/chat/${vendorId}/${conv.id}`)}
              className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-divider-soft ${
                conv.id === conversationId ? 'bg-surface-input' : 'hover:bg-surface-input'
              }`}
            >
              {conv.avatar ? (
                <img src={conv.avatar} alt="" className="w-10 h-10 rounded-full" />
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm ${conv.color}`}>
                  {conv.initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-medium text-sm truncate">{conv.contactName}</span>
                </div>
                <span className="text-xs text-muted truncate block">{conv.contactPhone}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-surface-deep relative">
        {/* Chat Header */}
        <div className="h-16 bg-surface-input flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-3">
            {currentConv.avatar ? (
              <img src={currentConv.avatar} alt="" className="w-10 h-10 rounded-full" />
            ) : (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm ${currentConv.color}`}>
                {currentConv.initials}
              </div>
            )}
            <div>
              <h2 className="font-semibold text-primary">{currentConv.contactName}</h2>
              <p className="text-xs text-muted">{currentConv.contactPhone}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-muted">
            <button className="hover:text-primary transition-colors"><Download className="h-5 w-5" /></button>
            <button className="hover:text-primary transition-colors"><Settings className="h-5 w-5" /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide relative">
          <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: '400px' }}></div>
          <div className="relative z-10 space-y-4">
            {MOCK_MESSAGES.map((msg) => {
            const isVendor = msg.sender === 'vendor';
            return (
              <div key={msg.id} className={`flex ${isVendor ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-lg p-2 shadow-sm relative ${
                  isVendor 
                    ? 'bg-message-out text-primary rounded-tr-none' 
                    : 'bg-message-in text-primary rounded-tl-none'
                }`}>
                  {/* Sender Name (only for vendor in this mock to match image) */}
                  {isVendor && <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Consultora Joyce</p>}
                  
                  {msg.type === 'audio' ? (
                    <div className="flex flex-col gap-2 min-w-[200px] pb-3">
                      <div className="flex items-center gap-3">
                        <button className="p-2 bg-surface-input rounded-full text-secondary">
                          <Play className="h-4 w-4 fill-current" />
                        </button>
                        <div className="flex-1 h-1 bg-divider-subtle rounded-full overflow-hidden">
                          <div className="w-1/3 h-full bg-emerald-500"></div>
                        </div>
                        <img src="https://i.pravatar.cc/150?u=joyce" className="w-8 h-8 rounded-full" alt="" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-brand-light font-medium cursor-pointer hover:underline">Transcrever áudio</span>
                        <span className="text-[10px] text-muted">{msg.duration}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[14.2px] leading-relaxed whitespace-pre-wrap pb-3 pr-8">{msg.text}</p>
                  )}
                  
                  <span className="text-[11px] text-muted absolute bottom-1.5 right-2">
                    {msg.time}
                  </span>
                </div>
              </div>
            );
          })}
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-surface-input p-3 flex items-center gap-3 z-10">
          <button className="p-2 text-muted hover:text-primary transition-colors">
            <Paperclip className="h-6 w-6" />
          </button>
          <div className="flex-1 bg-white dark:bg-surface-input rounded-lg flex items-center px-4 py-2.5 shadow-sm">
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite uma mensagem" 
              className="w-full bg-transparent border-none outline-none text-primary placeholder-muted text-[15px]"
            />
          </div>
          <button className="p-2 text-muted hover:text-primary transition-colors">
            <Mic className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
