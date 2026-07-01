export default async function handler(req, res) {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const WRIKE_TOKEN = process.env.WRIKE_TOKEN;
  const FOLDER_ID   = process.env.WRIKE_FOLDER_ID;

  console.log('TOKEN exists:', !!WRIKE_TOKEN);
  console.log('FOLDER_ID:', FOLDER_ID);
  console.log('Body:', JSON.stringify(req.body));

  if (!WRIKE_TOKEN || !FOLDER_ID) {
    return res.status(500).json({ error: 'Variáveis de ambiente não configuradas', token: !!WRIKE_TOKEN, folder: !!FOLDER_ID });
  }

  const {
    nomeProjeto, area, solicitante, objetivo, publicoAlvo,
    tipoProjeto, prazo, canal, prioridade, entregaveis,
    referencias, restricoes, linkBriefing, aprovador,
    entregaFinal, contexto
  } = req.body;

  // Título do card: Nome do Projeto | Área
  const titulo = `${nomeProjeto || 'Novo pedido'} | ${area || 'Sem área'}`;

  // Descrição formatada — uma linha em branco entre cada tópico
  const secaoSolicitante = [
    `• Solicitante: ${solicitante || '—'}`,
    `• Área: ${area || '—'}`,
    `• Objetivo principal: ${objetivo || '—'}`,
    `• Público-alvo: ${publicoAlvo || '—'}`,
  ].join('\n\n');

  const secaoProjeto = [
    `• Tipo de projeto: ${tipoProjeto || '—'}`,
    `• Prazo desejado: ${prazo || '—'}`,
    `• Canal de utilização: ${canal || '—'}`,
    `• Prioridade: ${prioridade || '—'}`,
    `• Entregáveis esperados: ${(entregaveis || []).join(', ') || '—'}`,
  ].join('\n\n');

  const secaoReferencias = [
    `• Referências visuais: ${referencias || '—'}`,
    `• O que não fazer: ${restricoes || '—'}`,
    `• Link do briefing completo: ${linkBriefing || '—'}`,
    `• Quem aprova: ${aprovador || '—'}`,
    `• Entrega final para: ${entregaFinal || '—'}`,
  ].join('\n\n');

  const description = `📋 BRIEFING DE CRIAÇÃO

👤 INFORMAÇÕES DO SOLICITANTE

${secaoSolicitante}

📦 SOBRE O PROJETO

${secaoProjeto}

🎨 REFERÊNCIAS E DIRECIONAMENTOS

${secaoReferencias}

📝 CONTEXTO ADICIONAL

${contexto || '—'}`;

  try {
    console.log('Calling Wrike API...');

    const response = await fetch(`https://www.wrike.com/api/v4/folders/${FOLDER_ID}/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WRIKE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: titulo,
        description,
        importance: prioridade === 'Alta' ? 'High' : prioridade === 'Média' ? 'Normal' : 'Low',
        dates: prazo ? { due: prazo } : undefined,
      })
    });

    const data = await response.json();
    console.log('Wrike response status:', response.status);
    console.log('Wrike response:', JSON.stringify(data));

    if (!response.ok) {
      return res.status(500).json({ error: 'Erro ao criar tarefa no Wrike', details: data });
    }

    return res.status(200).json({ success: true, taskId: data.data?.[0]?.id });

  } catch (err) {
    console.error('Fetch error:', err.message);
    return res.status(500).json({ error: 'Erro interno', details: err.message });
  }
}
