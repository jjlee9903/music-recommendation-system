import { useState } from "react";
import logo from "@/assets/musicreco.png";

export default function LoginView({
  onLogin,
  goSignup,
}: {
  onLogin: (email: string, password: string) => void;
  goSignup: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = () => {
    if (!email || !password) return;
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center p-4">
      {/* ✅ 흰색 로그인 카드 */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          {/* ✅ 로고 */}
          <img
            src={logo}
            alt="MusicReco logo"
            className="mx-auto h-28 w-28 object-contain mb-4"
          />
          {/* ✅ 문구를 굵게 변경 */}
          <p className="text-gray-700 font-semibold">
            태그 & 노래 기반 AI 음악 추천 서비스
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={submit}
            disabled={!email || !password}
            className={`w-full p-3 rounded-lg ${
              email && password
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            로그인
          </button>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={goSignup}
            className="text-green-500 hover:text-green-600"
          >
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
}
