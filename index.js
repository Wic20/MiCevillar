const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'micevillar'
};

let pool;

async function init() {
  // Crear conexión temporal para crear la base de datos si no existe
  const tmp = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password
  });
  await tmp.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
  await tmp.end();

  pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // Crear tablas si no existen
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT PRIMARY KEY,
      name VARCHAR(255),
      username VARCHAR(255) UNIQUE,
      email VARCHAR(255) UNIQUE,
      password VARCHAR(255),
      role VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id BIGINT PRIMARY KEY,
      title VARCHAR(255),
      description TEXT,
      filename VARCHAR(255),
      originalName VARCHAR(255),
      uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS requests (
      id BIGINT PRIMARY KEY,
      userId BIGINT,
      type VARCHAR(255),
      reason TEXT,
      copies INT,
      delivery VARCHAR(50),
      status VARCHAR(50),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  // Insertar usuarios de ejemplo si la tabla está vacía
  const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM users');
  if (rows[0].cnt === 0) {
    const now = Date.now();
    const users = [
      [1001, 'Admin Cevillar', 'admin', 'admin@cevillar.edu.hn', '$2a$10$zS2rFj8x.', 'admin'],
    ];
    // No insertar contraseñas reales; el admin podrá registrarse o usaremos ruta register
    for (const u of users) {
      try {
        await pool.query('INSERT IGNORE INTO users (id,name,username,email,password,role) VALUES (?,?,?,?,?,?)', u);
      } catch (e) {
        // ignore
      }
    }
  }
}

function getPool() {
  if (!pool) throw new Error('DB not initialized');
  return pool;
}

// Usuarios
async function findUserByEmailOrUsername(identifier) {
  const p = getPool();
  const [rows] = await p.query('SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1', [identifier, identifier]);
  return rows[0] || null;
}

async function createUser(user) {
  const p = getPool();
  const id = user.id || Date.now();
  await p.query('INSERT INTO users (id,name,username,email,password,role) VALUES (?,?,?,?,?,?)', [id, user.name, user.username, user.email, user.password, user.role || 'student']);
  return { id, ...user };
}

// Documentos
async function listDocuments() {
  const p = getPool();
  const [rows] = await p.query('SELECT * FROM documents ORDER BY uploadedAt DESC');
  return rows;
}

async function createDocument(doc) {
  const p = getPool();
  const id = doc.id || Date.now();
  await p.query('INSERT INTO documents (id,title,description,filename,originalName,uploadedAt) VALUES (?,?,?,?,?,?)', [id, doc.title, doc.description, doc.filename, doc.originalName, doc.uploadedAt || new Date()]);
  return { id, ...doc };
}

async function getDocumentById(id) {
  const p = getPool();
  const [rows] = await p.query('SELECT * FROM documents WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

// Solicitudes
async function listRequests() {
  const p = getPool();
  const [rows] = await p.query('SELECT * FROM requests ORDER BY createdAt DESC');
  return rows;
}

async function createRequest(req) {
  const p = getPool();
  const id = req.id || Date.now();
  await p.query('INSERT INTO requests (id,userId,type,reason,copies,delivery,status,createdAt) VALUES (?,?,?,?,?,?,?,?)', [id, req.userId, req.type, req.reason, req.copies, req.delivery, req.status || 'pendiente', req.createdAt || new Date()]);
  return { id, ...req };
}

async function updateRequestStatus(id, status) {
  const p = getPool();
  await p.query('UPDATE requests SET status = ? WHERE id = ?', [status, id]);
  const [rows] = await p.query('SELECT * FROM requests WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

module.exports = {
  init,
  getPool,
  findUserByEmailOrUsername,
  createUser,
  listDocuments,
  createDocument,
  getDocumentById,
  listRequests,
  createRequest,
  updateRequestStatus
};
