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
      <div className="p-4 border-b border-primary/20 bg-surface/50 backdrop-blur-md flex-none">
        <h2 className="font-headline-lg text-[20px] font-bold text-on-surface flex items-center gap-2">
          <MessageSquareText size={20} className="text-primary" /> Social
        </h2>
        <p className="text-[12px] text-on-surface-variant">Comparte ideas o actualizaciones con toda la red.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 pb-20">
        
        {/* CREATE POST BOX */}
        <div className="glass-card p-4 rounded-xl border border-primary/30">
          <form onSubmit={handlePostSubmit} className="flex flex-col gap-3">
            <textarea
              className="input-field w-full min-h-[80px] p-3 text-sm resize-none"
              placeholder="¿Qué está pasando?"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
            />
            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={!postText.trim()}
                className="btn-primary px-6 py-2 flex items-center gap-2 disabled:opacity-50 text-sm"
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
              <div key={post.id} className="glass-card flex flex-col border border-outline-variant/30 rounded-xl overflow-hidden">
                {/* POST CONTENT */}
                <div className="p-4 flex gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0" style={{ backgroundColor: `${color}20`, color: color }}>
                    {post.avatar || (post.nombre ? post.nombre.charAt(0).toUpperCase() : '?')}
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-on-surface text-[14px]">{post.nombre}</span>
                        <span className="text-[11px] text-on-surface-variant bg-surface-variant/40 px-1.5 rounded">{post.zona}</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant/60">{new Date(post.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="mt-2 text-[14px] text-on-surface/90 whitespace-pre-wrap break-words">{post.text}</p>
                    
                    {/* Interaction Bar */}
                    <div className="mt-3 flex gap-4">
                      <button 
                        onClick={() => {
                            setActiveReplyPostId(activeReplyPostId === post.id ? null : post.id);
                            setReplyText('');
                        }}
                        className="text-[12px] text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 font-bold"
                      >
                        <MessageSquareText size={14} /> Responder
                      </button>
                      <span className="text-[12px] text-on-surface-variant/60">
                        {post.comments?.length || 0} {(post.comments?.length === 1) ? 'respuesta' : 'respuestas'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* REPLY BOX */}
                {activeReplyPostId === post.id && (
                  <div className="bg-surface-container-highest/50 p-3 border-t border-outline-variant/20">
                    <form onSubmit={(e) => handleReplySubmit(e, post.id)} className="flex gap-2">
                      <input 
                        type="text"
                        autoFocus
                        className="input-field flex-1 text-[13px] px-3 py-2"
                        placeholder="Escribe tu respuesta..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <button type="submit" disabled={!replyText.trim()} className="btn-primary px-4 py-2">
                        <Send size={14} />
                      </button>
                    </form>
                  </div>
                )}

                {/* COMMENTS */}
                {post.comments && post.comments.length > 0 && (
                  <div className="bg-surface-container/30 flex flex-col">
                    {post.comments.map(comment => {
                      const cIsMe = comment.senderId === myId;
                      const cPeer = peers.find(p => p.id === comment.senderId);
                      const cColor = cIsMe ? '#ffb3ad' : (cPeer?.color || '#fff');
                      
                      return (
                        <div key={comment.id} className="p-3 pl-12 flex gap-3 border-t border-outline-variant/10">
                          <div className="w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ backgroundColor: `${cColor}15`, color: cColor }}>
                            {comment.avatar || (comment.nombre ? comment.nombre.charAt(0).toUpperCase() : '?')}
                          </div>
                          <div className="flex flex-col flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-on-surface text-[12px]">{comment.nombre}</span>
                              <span className="text-[9px] text-on-surface-variant/60">{new Date(comment.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-[13px] text-on-surface/80 mt-0.5 break-words">{comment.text}</p>
                            <button 
                              onClick={() => {
                                setActiveReplyPostId(post.id);
                                setReplyText(`@${comment.nombre} `);
                              }}
                              className="text-[10px] text-on-surface-variant hover:text-primary transition-colors mt-1 font-bold w-fit"
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
