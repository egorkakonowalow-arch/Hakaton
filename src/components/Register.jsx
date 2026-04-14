import { useNavigate, Link } from 'react-router-dom';
import { mockApi } from '../services/mockApi';

export default function Register() {
  const navigate = useNavigate();

  function handleRegister(e) {
    e.preventDefault();
    mockApi.setSession({ loggedIn: true });
    navigate('/', { replace: true });
  }

  return (
    <div className="login-page">
      <div className="login-blob login-blob--1" aria-hidden />
      <div className="login-blob login-blob--2" aria-hidden />
      <div className="login-blob login-blob--3" aria-hidden />
      <div className="login-card">
        <h1>Регистрация</h1>
        <p className="sub">Создайте учётную запись (демо)</p>
        <form onSubmit={handleRegister}>
          <div className="login-field">
            <span className="ico" aria-hidden>
              👤
            </span>
            <input name="name" placeholder="ФИО" />
          </div>
          <div className="login-field">
            <span className="ico" aria-hidden>
              ✉
            </span>
            <input name="email" type="email" placeholder="Электронная почта" />
          </div>
          <div className="login-field">
            <span className="ico" aria-hidden>
              🔒
            </span>
            <input type="password" name="pass" placeholder="Пароль" />
          </div>
          <div className="login-actions">
            <button type="submit" className="btn btn--primary">
              Зарегистрироваться
            </button>
          </div>
        </form>
        <div className="footer-link">
          <Link to="/login">Уже есть аккаунт? Вход</Link>
        </div>
      </div>
    </div>
  );
}
