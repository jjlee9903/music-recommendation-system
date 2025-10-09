// SignupView.tsx
import { useState } from "react";
import logo from "@/assets/musicreco.png";

export default function SignupView({ onSignup, goLogin }:{ onSignup:(name:string,email:string)=>void; goLogin:()=>void }) {
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <img src={logo} className="mx-auto h-20 w-20 object-contain mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">MusicReco</h1>
          <p className="text-gray-600 mt-2">새로운 계정을 만들어보세요</p>
        </div>
        <div className="space-y-4">
          <input type="text" placeholder="이름" value={name} onChange={(e)=>setName(e.target.value)} className="w-full p-3 border rounded-lg"/>
          <input type="email" placeholder="이메일" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full p-3 border rounded-lg"/>
          <input type="password" placeholder="비밀번호" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full p-3 border rounded-lg"/>
          <button onClick={()=>onSignup(name,email)} className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600">가입하기</button>
        </div>
        <div className="text-center mt-6">
          <button onClick={goLogin} className="text-green-500 hover:text-green-600">이미 계정이 있으신가요? 로그인</button>
        </div>
      </div>
    </div>
  );
}
