if (typeof io !== 'undefined') {
  const socket = io(location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://turbokarts-chat.dynu.net')
  const chat = document.getElementById('chat');

  socket.on('online', n => document.getElementById('online').textContent = n);

  socket.on('chat', m => {
    const line = document.createElement('div');
    const b = document.createElement('b');
    b.textContent = m.name + ' : ';
    line.append(b, document.createTextNode(m.text)); // textContent : pas de faille XSS
    chat.appendChild(line);
    chat.scrollTop = chat.scrollHeight;
  });

  const send = () => {
    const input = document.getElementById('msg');
    const name = document.getElementById('pseudo').value.trim() || 'Anonyme';
    if (input.value.trim()) socket.emit('chat', { name, text: input.value });
    input.value = '';
  };
  document.getElementById('send').addEventListener('click', send);
  document.getElementById('msg').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
}