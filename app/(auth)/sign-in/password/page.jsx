"use client";

import { useEffect, useState, useContext } from "react";
import Link from "next/link";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../firebase/firebaseConfig";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AuthContext } from "@/components/AuthProvider";
import { Loader } from "lucide-react";
import Logo from "@/app/Lookvisa.png"
import Image from "next/image";
import PrivacyFooter from "@/components/PrivacyFooter";
const EnterPassword = () => {
  const router = useRouter();
  const { isLoggedIn, login } = useContext(AuthContext); // Get the login function and user from context
  const [redirectPath, setRedirectPath] = useState("/"); // State to store the redirect path

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const redirectPathInStorage = sessionStorage.getItem("redirect");
    if (redirectPathInStorage) {
      setRedirectPath(redirectPathInStorage);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      router.push("/"); // If already logged in, redirect to home
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    if (!storedEmail) {
      router.push("/sign-in");
    }
    setEmail(storedEmail);
  }, [router]);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) {
      setError("Password is required");
      toast.error("Password is required");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const response = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: user.uid,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate token.");

      const { token, role, completedProfile } = await response.json();
      localStorage.setItem("token", token);
      localStorage.removeItem("email");
      toast.success("You are logged in successfully!");
      login(token);

      if (redirectPath === "/") {
        if (!completedProfile) {
          setRedirectPath("/profile")
        } else if (role === "Admin") {
          setRedirectPath("/admin/home")
        }
      }

      return router.replace(redirectPath);
    } catch (err) {
      setError(err.message);
      toast.error("Please enter a valid password");
      setLoading(false)
    }
  };

  return (
    <>

      <div className="mx-auto container min-h-screen">
        <div className="flex p-4 w-full  items-center justify-start">
          <Link href={"/"}>
            <Image src={Logo} alt="Lookvisa" width={120} className="" />
          </Link>
        </div>
        <div className="min-h-[70vh] flex flex-col items-center justify-center">
          <div className="p-5 rounded-lg w-[90%] sm:w-[90%] md:max-w-[400px] lg:max-w-[500px] mx-auto">
            <h1 className="text-4xl text-black text-center mb-10">Password</h1>
            <div className="mt-2">
              <form onSubmit={handleLogin}>
                <div className="flex flex-col">
                  <label className="font-semibold text-black text-sm">
                    Please enter Password
                  </label>
                  <div className="w-full relative">
                    <input
                      className={`text-black rounded-[5px] p-1 mt-2 outline-blue-200 w-full border ${error ? "outline-red-500" : ""}`}
                      maxLength={20}
                      type={passwordVisible ? "text" : "password"}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-4 text-sm font-semibold text-black"
                    >
                      {passwordVisible ? <FaEye /> : <FaEyeSlash />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className="flex items-center justify-center text-center w-full p-2 bg-green-500 text-white font-bold rounded-md mt-5"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader className="animate-spin" size={18} />
                  ) : (
                    "Sign in"
                  )}
                </button>
              </form>
            </div>
            <div className="mt-4 flex items-center justify-end w-full">
              <Link className="text-blue-500 underline" href={"/forget-password"}>
                Forgot Password?
              </Link>
            </div>
          </div>
        </div>

      </div>
      <PrivacyFooter />
    </>
  );
};

export default EnterPassword;
