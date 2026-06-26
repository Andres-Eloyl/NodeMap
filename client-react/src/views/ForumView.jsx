import { useState } from 'react';
import { useWebRTCStore } from '../store/useWebRTCStore';
import { MessageSquareText, Send } from 'lucide-react';

export function ForumView() {
  const forumMessages = useWebRTCStore(state => state.forumMessages);
  const myId = useWebRTCStore(state => state.myId);
  const peers = useWebRTCStore(state => state.peers);
  const sendMessageToForum = useWebRTCStore(state => state.sendMessageToForum);
  const sendCommentToPost = useWebRTCStore(state => state.sendCommentToPost);
  
  const [postText, setPostText] = useState('');
  const [activeReplyPostId, setActiveReplyPostId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (!postText.trim()) return;
    sendMessageToForum(postText.trim());
    setPostText('');
  };

  const handleReplySubmit = (e, postId) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    sendCommentToPost(postId, replyText.trim());
    setReplyText('');
    setActiveReplyPostId(null);
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden relative">
      <div className="p-4 border-b border-white/10 glass-panel flex-none relative z-10">
        <h2 className="font-logo text-[20px] font-bold text-white flex items-center gap-2">
          <MessageSquareText size={20} className="text-orange-400" /> Social
        </h2>
        <p className="text-[12px] text-white/60 font-mono">Comparte ideas o actualizaciones con toda la red.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 pb-20">
        
        {/* CREATE POST BOX */}
        <div className="glass-panel p-4 rounded-xl border-orange-500/30">
          <form onSubmit={handlePostSubmit} className="flex flex-col gap-3">
            <textarea
              className="w-full min-h-[80px] p-3 text-sm resize-none bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-orange-500/50 focus:bg-white/10 transition-colors"
              placeholder="¿Qué está pasando?"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
            />
            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={!postText.trim()}
                className="bg-orange-500 text-[#05050a] px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 text-sm font-bold shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:scale-105 active:scale-95 transition-all"
              >
                <Send size={16} /> Publicar
              </button>
            </div>
          </form>
        </div>

        {/* FEED */}
        <div className="flex flex-col gap-4">
          {forumMessages.length === 0 && (
            <div className="text-center py-10 opacity-50">
              <MessageSquareText size={48} className="mx-auto mb-3 opacity-30" />
              <p>Social está vacío. ¡Sé el primero en publicar!</p>
            </div>
          )}

          {forumMessages.map((post) => {
            const isMe = post.senderId === myId;
            const peer = peers.find(p => p.id === post.senderId);
            const color = isMe ? '#ffb3ad' : (peer?.color || '#fff');
            
            return (
              <div key={post.id} className="glass-panel flex flex-col border border-white/10 hover:border-white/20 transition-colors rounded-xl overflow-hidden">
                {/* POST CONTENT */}
                <div className="p-4 flex gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0" style={{ backgroundColor: `${color}20`, color: color }}>
                    {post.avatar || (post.nombre ? post.nombre.charAt(0).toUpperCase() : '?')}
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-[14px]">{post.nombre}</span>
                        <span className="text-[10px] text-white/50 bg-black/40 px-1.5 py-0.5 rounded font-mono">{post.zona}</span>
                      </div>
                      <span className="text-[10px] text-white/40 font-mono">{new Date(post.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="mt-2 text-[14px] text-white/90 whitespace-pre-wrap break-words">{post.text}</p>
                    
                    {/* Interaction Bar */}
                    <div className="mt-4 flex gap-4">
                      <button 
                        onClick={() => {
                            setActiveReplyPostId(activeReplyPostId === post.id ? null : post.id);
                            setReplyText('');
                        }}
                        className="text-[12px] text-white/50 hover:text-orange-400 transition-colors flex items-center gap-1 font-bold"
                      >
                        <MessageSquareText size={14} /> Responder
                      </button>
                      <span className="text-[12px] text-white/40">
                        {post.comments?.length || 0} {(post.comments?.length === 1) ? 'respuesta' : 'respuestas'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* REPLY BOX */}
                {activeReplyPostId === post.id && (
                  <div className="bg-black/40 p-3 border-t border-white/10">
                    <form onSubmit={(e) => handleReplySubmit(e, post.id)} className="flex gap-2">
                      <input 
                        type="text"
                        autoFocus
                        className="flex-1 text-[13px] px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-orange-500/50"
                        placeholder="Escribe tu respuesta..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <button type="submit" disabled={!replyText.trim()} className="bg-orange-500 text-[#05050a] px-4 py-2 rounded-lg font-bold">
                        <Send size={14} />
                      </button>
                    </form>
                  </div>
                )}

                {/* COMMENTS */}
                {post.comments && post.comments.length > 0 && (
                  <div className="bg-white/5 flex flex-col">
                    {post.comments.map(comment => {
                      const cIsMe = comment.senderId === myId;
                      const cPeer = peers.find(p => p.id === comment.senderId);
                      const cColor = cIsMe ? '#ffb3ad' : (cPeer?.color || '#fff');
                      
                      return (
                        <div key={comment.id} className="p-3 pl-12 flex gap-3 border-t border-white/10">
                          <div className="w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ backgroundColor: `${cColor}15`, color: cColor }}>
                            {comment.avatar || (comment.nombre ? comment.nombre.charAt(0).toUpperCase() : '?')}
                          </div>
                          <div className="flex flex-col flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-[12px]">{comment.nombre}</span>
                              <span className="text-[9px] text-white/40 font-mono">{new Date(comment.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-[13px] text-white/80 mt-0.5 break-words">{comment.text}</p>
                            <button 
                              onClick={() => {
                                setActiveReplyPostId(post.id);
                                setReplyText(`@${comment.nombre} `);
                              }}
                              className="text-[10px] text-white/50 hover:text-orange-400 transition-colors mt-1 font-bold w-fit"
                            >
                              Responder
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
