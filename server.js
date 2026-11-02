const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Conexão com o Banco PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

/* ===================================================
   ROTAS DE PACIENTES
   =================================================== */

// Cadastrar novo paciente
app.post('/api/pacientes', async (req, res) => {
    const { nome, cpf, telefone, data_nascimento, convenio } = req.body;
    try {
        const query = `
            INSERT INTO pacientes (nome, cpf, telefone, data_nascimento, convenio)
            VALUES ($1, $2, $3, $4, $5) RETURNING *;
        `;
        const result = await pool.query(query, [nome, cpf, telefone, data_nascimento, convenio]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao cadastrar paciente', detalhes: error.message });
    }
});

// Listar todos os pacientes
app.get('/api/pacientes', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM pacientes ORDER BY nome ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar pacientes' });
    }
});

/* ===================================================
   ROTAS DA AGENDA INTELIGENTE
   =================================================== */

// Criar um novo agendamento
app.post('/api/agendamentos', async (req, res) => {
    const { paciente_id, medico_id, data_inicio, data_fim, observacoes } = req.body;
    try {
        const query = `
            INSERT INTO agendamentos (paciente_id, medico_id, data_inicio, data_fim, observacoes)
            VALUES ($1, $2, $3, $4, $5) RETURNING *;
        `;
        const result = await pool.query(query, [paciente_id, medico_id, data_inicio, data_fim, observacoes]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao agendar consulta', detalhes: error.message });
    }
});

// Listar agendamentos com dados do paciente
app.get('/api/agendamentos', async (req, res) => {
    try {
        const query = `
            SELECT a.id, a.data_inicio, a.data_fim, a.status, a.observacoes,
                   p.nome AS paciente_nome, p.telefone AS paciente_telefone
            FROM agendamentos a
            JOIN pacientes p ON a.paciente_id = p.id
            ORDER BY a.data_inicio ASC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar agenda' });
    }
});

/* ===================================================
   ROTAS DE PRONTUÁRIO ELETRÔNICO (PEP)
   =================================================== */

// Salvar um novo registo de prontuário
app.post('/api/prontuarios', async (req, res) => {
    const { paciente_id, medico_id, subjetivo, objetivo, avaliacao, plano } = req.body;
    try {
        const query = `
            INSERT INTO prontuarios (paciente_id, medico_id, subjetivo, objetivo, avaliacao, plano)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
        `;
        const result = await pool.query(query, [paciente_id, medico_id, subjetivo, objetivo, avaliacao, plano]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao registar prontuário' });
    }
});

// Buscar histórico de prontuários de um paciente específico
app.get('/api/prontuarios/paciente/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT pr.*, u.nome AS medico_nome
            FROM prontuarios pr
            JOIN usuarios u ON pr.medico_id = u.id
            WHERE pr.paciente_id = $1
            ORDER BY pr.criado_em DESC;
        `;
        const result = await pool.query(query, [id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar prontuários do paciente' });
    }
});

// Inicialização do Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor a rodar na porta ${PORT}`);
});
