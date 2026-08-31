"""
Crypto Suite - Backend API with MySQL (XAMPP)
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json
import os
import sys
import logging

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from encryption_engine import EncryptionEngine
from caesar_cipher import CaesarCipher
from vigenere_cipher import VigenereCipher
from utils import EncryptionUtils

# Initialize Flask app
app = Flask(__name__, static_folder='../frontend', static_url_path='')
app.config['SECRET_KEY'] = 'DecodeLabs_Secure_Key_2026'

# ============================================
# DATABASE CONFIGURATION - MYSQL (XAMPP)
# ============================================
# MySQL Configuration for XAMPP
MYSQL_HOST = 'localhost'
MYSQL_USER = 'root'
MYSQL_PASSWORD = ''  # Default XAMPP password is empty
MYSQL_DATABASE = 'crypto_suite'

# Create MySQL connection string
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f'mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}/{MYSQL_DATABASE}'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = True  # Set to True for debugging

print(f"📁 Database: MySQL @ {MYSQL_HOST}/{MYSQL_DATABASE}")

# Initialize extensions
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")
db = SQLAlchemy(app)

# Setup logging
os.makedirs('../logs', exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('../logs/encryption.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ============================================
# DATABASE MODELS
# ============================================

class EncryptionLog(db.Model):
    __tablename__ = 'encryption_logs'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    method = db.Column(db.String(50), nullable=False)
    original_text = db.Column(db.Text, nullable=False)
    encrypted_text = db.Column(db.Text, nullable=False)
    decrypted_text = db.Column(db.Text, nullable=False)
    parameters = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    user_ip = db.Column(db.String(50))
    status = db.Column(db.String(20), default='success')
    duration_ms = db.Column(db.Float, default=0.0)
    session_id = db.Column(db.String(100))

    def to_dict(self):
        return {
            'id': self.id,
            'method': self.method,
            'original_text': self.original_text[:50] + '...' if len(self.original_text) > 50 else self.original_text,
            'encrypted_text': self.encrypted_text[:50] + '...' if len(self.encrypted_text) > 50 else self.encrypted_text,
            'parameters': json.loads(self.parameters) if self.parameters else {},
            'timestamp': self.timestamp.isoformat(),
            'status': self.status,
            'duration_ms': self.duration_ms
        }
    
    def to_full_dict(self):
        return {
            'id': self.id,
            'method': self.method,
            'original_text': self.original_text,
            'encrypted_text': self.encrypted_text,
            'decrypted_text': self.decrypted_text,
            'parameters': json.loads(self.parameters) if self.parameters else {},
            'timestamp': self.timestamp.isoformat(),
            'user_ip': self.user_ip,
            'status': self.status,
            'duration_ms': self.duration_ms,
            'session_id': self.session_id
        }

class SecurityAudit(db.Model):
    __tablename__ = 'security_audit'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    action = db.Column(db.String(50), nullable=False)
    user_ip = db.Column(db.String(50))
    details = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'action': self.action,
            'user_ip': self.user_ip,
            'details': json.loads(self.details) if self.details else {},
            'timestamp': self.timestamp.isoformat()
        }

# ============================================
# INITIALIZE DATABASE
# ============================================

def init_database():
    try:
        with app.app_context():
            db.create_all()
            logger.info("✅ Database tables created successfully")
            
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            logger.info(f"📊 Existing tables: {tables}")
            
            # Verify connection
            print("\n" + "="*60)
            print("  ✅ MYSQL CONNECTION: SUCCESS")
            print(f"  📊 Database: {MYSQL_DATABASE} @ {MYSQL_HOST}")
            print("="*60)
            
    except Exception as e:
        logger.error(f"❌ Database initialization error: {str(e)}")
        print("\n" + "="*60)
        print("❌ MYSQL CONNECTION ERROR")
        print("="*60)
        print("Please check:")
        print("1. XAMPP is running (Apache + MySQL)")
        print("2. Database 'crypto_suite' exists in phpMyAdmin")
        print("3. MySQL credentials are correct")
        print(f"\nError: {str(e)}")
        print("="*60 + "\n")
        raise

# Initialize encryption engine
engine = EncryptionEngine()
utils = EncryptionUtils()

# ============================================
# ROUTES
# ============================================

@app.route('/')
def serve_frontend():
    return send_from_directory('../frontend', 'index.html')

@app.route('/api/encrypt/caesar', methods=['POST'])
def caesar_encrypt():
    start_time = datetime.now()
    try:
        data = request.json
        text = data.get('text', '')
        shift = int(data.get('shift', 3))
        
        logger.info(f"Caesar encryption - Text: {text[:30]}..., Shift: {shift}")
        
        result = engine.encrypt_with_caesar(text, shift)
        duration = (datetime.now() - start_time).total_seconds() * 1000
        
        log_entry = EncryptionLog(
            method='Caesar Cipher',
            original_text=text,
            encrypted_text=result.get('encrypted', ''),
            decrypted_text=result.get('decrypted', ''),
            parameters=json.dumps({'shift': shift}),
            user_ip=request.remote_addr,
            status=result.get('status', 'success'),
            duration_ms=duration
        )
        db.session.add(log_entry)
        
        audit = SecurityAudit(
            action='ENCRYPT',
            user_ip=request.remote_addr,
            details=json.dumps({'method': 'Caesar', 'shift': shift})
        )
        db.session.add(audit)
        db.session.commit()
        
        socketio.emit('new_encryption', {
            'method': 'Caesar Cipher',
            'timestamp': datetime.now().isoformat(),
            'id': log_entry.id
        })
        
        result['db_id'] = log_entry.id
        result['duration_ms'] = duration
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Caesar encryption error: {str(e)}")
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/api/encrypt/vigenere', methods=['POST'])
def vigenere_encrypt():
    start_time = datetime.now()
    try:
        data = request.json
        text = data.get('text', '')
        key = data.get('key', 'KEY')
        
        logger.info(f"Vigenere encryption - Text: {text[:30]}..., Key: {key}")
        
        result = engine.encrypt_with_vigenere(text, key)
        duration = (datetime.now() - start_time).total_seconds() * 1000
        
        log_entry = EncryptionLog(
            method='Vigenere Cipher',
            original_text=text,
            encrypted_text=result.get('encrypted', ''),
            decrypted_text=result.get('decrypted', ''),
            parameters=json.dumps({'key': key}),
            user_ip=request.remote_addr,
            status=result.get('status', 'success'),
            duration_ms=duration
        )
        db.session.add(log_entry)
        
        audit = SecurityAudit(
            action='ENCRYPT',
            user_ip=request.remote_addr,
            details=json.dumps({'method': 'Vigenere', 'key_length': len(key)})
        )
        db.session.add(audit)
        db.session.commit()
        
        socketio.emit('new_encryption', {
            'method': 'Vigenere Cipher',
            'timestamp': datetime.now().isoformat(),
            'id': log_entry.id
        })
        
        result['db_id'] = log_entry.id
        result['duration_ms'] = duration
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Vigenere encryption error: {str(e)}")
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/api/encrypt/hybrid', methods=['POST'])
def hybrid_encrypt():
    start_time = datetime.now()
    try:
        data = request.json
        text = data.get('text', '')
        shift = int(data.get('shift', 3))
        key = data.get('key', 'KEY')
        
        logger.info(f"Hybrid encryption - Text: {text[:30]}..., Shift: {shift}, Key: {key}")
        
        result = engine.hybrid_encrypt(text, shift, key)
        duration = (datetime.now() - start_time).total_seconds() * 1000
        
        log_entry = EncryptionLog(
            method='Hybrid Cipher',
            original_text=text,
            encrypted_text=result.get('encrypted', ''),
            decrypted_text=result.get('decrypted', ''),
            parameters=json.dumps({'shift': shift, 'key': key}),
            user_ip=request.remote_addr,
            status=result.get('status', 'success'),
            duration_ms=duration
        )
        db.session.add(log_entry)
        
        audit = SecurityAudit(
            action='ENCRYPT',
            user_ip=request.remote_addr,
            details=json.dumps({'method': 'Hybrid', 'shift': shift})
        )
        db.session.add(audit)
        db.session.commit()
        
        socketio.emit('new_encryption', {
            'method': 'Hybrid Cipher',
            'timestamp': datetime.now().isoformat(),
            'id': log_entry.id
        })
        
        result['db_id'] = log_entry.id
        result['duration_ms'] = duration
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Hybrid encryption error: {str(e)}")
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/api/bruteforce', methods=['POST'])
def brute_force():
    try:
        data = request.json
        ciphertext = data.get('ciphertext', '')
        
        logger.info(f"Brute force - Ciphertext: {ciphertext[:30]}...")
        
        cipher = CaesarCipher(0)
        results = cipher.brute_force(ciphertext)
        
        audit = SecurityAudit(
            action='BRUTEFORCE',
            user_ip=request.remote_addr,
            details=json.dumps({'ciphertext': ciphertext[:50], 'attempts': len(results)})
        )
        db.session.add(audit)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'results': results[:5],
            'total': len(results)
        })
        
    except Exception as e:
        logger.error(f"Brute force error: {str(e)}")
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    try:
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        logs = EncryptionLog.query.order_by(
            EncryptionLog.timestamp.desc()
        ).offset(offset).limit(limit).all()
        
        total = EncryptionLog.query.count()
        
        return jsonify({
            'status': 'success',
            'data': [log.to_dict() for log in logs],
            'total': total,
            'limit': limit,
            'offset': offset
        })
        
    except Exception as e:
        logger.error(f"History fetch error: {str(e)}")
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        total = EncryptionLog.query.count()
        successful = EncryptionLog.query.filter_by(status='success').count()
        
        from sqlalchemy import func
        method_counts = db.session.query(
            EncryptionLog.method, 
            func.count(EncryptionLog.method)
        ).group_by(EncryptionLog.method).all()
        
        methods_used = {method: count for method, count in method_counts}
        
        last = EncryptionLog.query.order_by(
            EncryptionLog.timestamp.desc()
        ).first()
        
        avg_duration = db.session.query(
            func.avg(EncryptionLog.duration_ms)
        ).filter(EncryptionLog.status == 'success').scalar() or 0
        
        return jsonify({
            'status': 'success',
            'stats': {
                'total_operations': total,
                'successful_operations': successful,
                'failed_operations': total - successful,
                'success_rate': f"{(successful/total*100):.1f}%" if total > 0 else "0%",
                'methods_used': methods_used,
                'last_operation': last.timestamp.isoformat() if last else None,
                'avg_duration_ms': f"{avg_duration:.2f}"
            }
        })
        
    except Exception as e:
        logger.error(f"Stats error: {str(e)}")
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/api/export', methods=['GET'])
def export_data():
    try:
        logs = EncryptionLog.query.all()
        data = [log.to_full_dict() for log in logs]
        
        os.makedirs('../exports', exist_ok=True)
        filename = f"encryption_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = f"../exports/{filename}"
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        
        return jsonify({
            'status': 'success',
            'filename': filename,
            'count': len(data)
        })
        
    except Exception as e:
        logger.error(f"Export error: {str(e)}")
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/api/audit', methods=['GET'])
def get_audit():
    try:
        limit = request.args.get('limit', 50, type=int)
        logs = SecurityAudit.query.order_by(
            SecurityAudit.timestamp.desc()
        ).limit(limit).all()
        
        return jsonify({
            'status': 'success',
            'data': [log.to_dict() for log in logs],
            'total': len(logs)
        })
        
    except Exception as e:
        logger.error(f"Audit error: {str(e)}")
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/api/clear_logs', methods=['POST'])
def clear_logs():
    try:
        db.session.query(EncryptionLog).delete()
        db.session.commit()
        
        audit = SecurityAudit(
            action='CLEAR_LOGS',
            user_ip=request.remote_addr,
            details=json.dumps({'cleared': 'all encryption logs'})
        )
        db.session.add(audit)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'All logs cleared'
        })
        
    except Exception as e:
        logger.error(f"Clear logs error: {str(e)}")
        return jsonify({'status': 'error', 'error': str(e)}), 500

# SocketIO events
@socketio.on('connect')
def handle_connect():
    logger.info(f"Client connected: {request.remote_addr}")
    emit('connected', {'status': 'Connected to CryptoSuite'})

@socketio.on('disconnect')
def handle_disconnect():
    logger.info(f"Client disconnected: {request.remote_addr}")

# ============================================
# MAIN ENTRY POINT
# ============================================

if __name__ == '__main__':
    # Create necessary directories
    os.makedirs('../logs', exist_ok=True)
    os.makedirs('../database', exist_ok=True)
    os.makedirs('../exports', exist_ok=True)
    
    # Initialize database
    try:
        init_database()
        print("\n" + "="*60)
        print("  ✅ MYSQL CONNECTION: SUCCESS")
        print(f"  📊 Database: {MYSQL_DATABASE} @ {MYSQL_HOST}")
        print("="*60)
    except Exception as e:
        print("\n" + "="*60)
        print("  ❌ MYSQL CONNECTION: FAILED")
        print("="*60)
        print("Please check:")
        print("1. XAMPP is running (Apache + MySQL)")
        print("2. Database 'crypto_suite' exists in phpMyAdmin")
        print("3. MySQL credentials are correct")
        print("="*60 + "\n")
        print("⚠️  Falling back to SQLite...")
        
        # Fallback to SQLite
        import os
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        DB_PATH = os.path.join(BASE_DIR, 'database', 'encryption_logs.db')
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_PATH}'
        with app.app_context():
            db.create_all()
        print("✅ Using SQLite as fallback")
        print(f"📁 Database file: {DB_PATH}")
    
    logger.info("Starting Crypto Suite Backend...")
    
    print("\n" + "="*60)
    print("  🔐 CRYPTOSUITE ENTERPRISE EDITION")
    print("="*60)
    print("  Server: 0.0.0.0:5000")
    print("  Protocol: HTTP")
    print("  Database: MySQL (XAMPP) with SQLite fallback")
    print("\n  📱 ACCESS URLs:")
    print("     http://cryptosuite.com:5000  (Main)")
    print("     http://localhost:5000  (Local)")
    print("     http://192.168.0.100:5000  (Network)")
    print("="*60 + "\n")
    
    # Start server
    socketio.run(
        app, 
        debug=True, 
        port=5000, 
        host='0.0.0.0'
    )