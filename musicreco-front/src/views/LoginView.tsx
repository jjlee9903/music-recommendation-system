// LoginView.tsx
import { useState } from "react";
import logo from "@/assets/musicreco.png";

export default function LoginView({ onLogin, goSignup }:{ onLogin:(email:string)=>void; goSignup:()=>void }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <img src={logo} className="mx-auto h-20 w-20 object-contain mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">MusicReco</h1>
          <p className="text-gray-600 mt-2">AI 기반 음악 추천 서비스</p>
        </div>
        <div className="space-y-4">
          <input type="email" placeholder="이메일" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"/>
          <input type="password" placeholder="비밀번호" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"/>
          <button onClick={()=>onLogin(email)} className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600">로그인</button>
        </div>
        <div className="text-center mt-6">
          <button onClick={goSignup} className="text-green-500 hover:text-green-600">회원가입</button>
        </div>
      </div>
    </div>
  );
}
