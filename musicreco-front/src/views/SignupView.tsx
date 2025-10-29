import { useState } from "react";

export default function SignupView({
  onSignup,
  goLogin,
}: {
  onSignup: (name: string, email: string, password: string) => void;
  goLogin: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = () => {
    if (!name || !email || !password) {
      alert("모든 정보를 입력해주세요.");
      return;
    }
    onSignup(name, email, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          회원가입
        </h1>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름"
          className="w-full p-3 mb-3 border rounded-lg"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          className="w-full p-3 mb-3 border rounded-lg"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          className="w-full p-3 mb-6 border rounded-lg"
        />

        <button
          onClick={submit}
          className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
        >
          가입하기
        </button>

        <button
          onClick={goLogin}
          className="w-full py-2 mt-3 text-gray-600 hover:text-gray-800 text-sm"
        >
          이미 계정이 있으신가요? 로그인
        </button>
      </div>
    </div>
  );
}
