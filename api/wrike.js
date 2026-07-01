export default async function handler(req, res) {
  // Permite apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const {
    nomeProjeto, area, solicitante, objetivo, publicoAlvo,
    tipoProjeto, prazo, canal, prioridade, entregaveis,
    referencias, restricoes, linkBriefing, aprovador,
    entregaFinal, contexto
  } = req.body;

  const WRIKE_TOKEN  = process.env.WRIKE_TOKEN;
  const FOLDER_ID    = process.env.WRIKE_FOLDER_ID;

  if (!WRIKE_TOKEN || !FOLDER_ID) {
    return res.status(500).json({ error: 'Variáveis de ambiente não configuradas' });
  }

  // Monta a descrição da tarefa com todos os campos do briefing
  const description = `
📋 BRIEFING DE CRIAÇÃO

👤 INFORMAÇÕES DO SOLICITANTE
• Solicitante: ${solicitante || '—'}
• Área: ${area || '—'}
• Objetivo principal: ${objetivo || '—'}
• Público-alvo: ${publicoAlvo || '—'}

📦 SOBRE O PROJETO
• Tipo de projeto: ${tipoProjeto || '—'}
• Prazo desejado: ${prazo || '—'}
• Canal de utilização: ${canal || '—'}
• Prioridade: ${prioridade || '—'}
• Entregáveis esperados: ${(entregaveis || []).join(', ') || '—'}

🎨 REFERÊNCIAS E DIRECIONAMENTOS
• Referências visuais: ${referencias || '—'}
• O que não fazer: ${restricoes || '—'}
• Link do briefing completo: ${linkBriefing || '—'}
• Quem aprova: ${aprovador || '—'}
• Entrega final para: ${entregaFinal || '—'}

📝 CONTEXTO ADICIONAL
${contexto || '—'}
  `.trim();

  try {
    const response = await fetch(`https://www.wrike.com/api/v4/folders/${FOLDER_ID}/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WRIKE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `[Briefing] ${nomeProjeto || 'Novo pedido'}`,
        description,
        importance: prioridade === 'Alta' ? 'High' : prioridade === 'Média' ? 'Normal' : 'Low',
        customStatus: 'Backlog',
        dates: prazo ? { due: prazo } : undefined,
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Wrike error:', data);
      return res.status(500).json({ error: 'Erro ao criar tarefa no Wrike', details: data });
    }

    return res.status(200).json({ success: true, taskId: data.data?.[0]?.id });

  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: 'Erro interno', details: err.message });
  }
}
