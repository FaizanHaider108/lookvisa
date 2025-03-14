"use client";

import React, { useState, useContext, useEffect, useRef } from "react";
import { usePathname } from "next/navigation"; // Import useRouter
import Logo from "../app/Lookvisa.png";
import Image from "next/image";
import Link from "next/link";
import profile from "../assets/profile.png";
import { RiMenuLine } from "react-icons/ri";
import { IoMdArrowDropdown } from "react-icons/io";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AuthContext } from "@/components/AuthProvider";
import { ArrowDownNarrowWide, LogOut } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { Separator } from "./ui/separator";
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname(); // Initialize useRouter
  const { isLoggedIn, logout } = useContext(AuthContext);
  const [token, setToken] = useState(null)
  const [showLogout, setShowLogout] = useState(false);
  const profileRef = useRef(null);

  const [avatarURL, setAvatarURL] = useState(null);
  const [role, setRole] = useState(null);
  const [firstName, setFirstName] = useState(null);
  const [lastName, setLastName] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setToken(null);
      return;
    }

    if (jwtDecode(storedToken).role === "Admin") {
      router.push("/admin/home");
    }

    setToken(storedToken);
    setAvatarURL(jwtDecode(storedToken).avatarURL);
    setRole(jwtDecode(storedToken).role);
    setFirstName(jwtDecode(storedToken).firstName);
    setLastName(jwtDecode(storedToken).lastName);
  }, []);

  // Decode the token to get the avatarURL
  useEffect(() => {
    if (token) {
      setAvatarURL(jwtDecode(token).avatarURL);
      setRole(jwtDecode(token).role);
      setFirstName(jwtDecode(token).firstName);
      setLastName(jwtDecode(token).lastName);
    }
  }, [token]);

  const toggleLogout = () => setShowLogout((prev) => !prev);

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowLogout(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Function to check if a link is active
  const isActive = (path) => {
    return pathname === path;
  };

  return (
    <div className="w-full border-b border-gray-200 bg-white z-10 sticky">
      <div className="container mx-auto flex items-center h-[70px] justify-between px-4">
        <div className="flex gap-10 items-center">
          <Link href="/">
            <Image src={Logo} alt="Lookvisa" width={120} />
          </Link>
          <ul className="flex gap-10 items-center max-md:hidden font-regular text-[16px] text-black">
            <Link
              href="/"
              className={`hover:underline hover:font-bold ${isActive("/") ? "underline font-bold" : ""
                }`}
            >
              Home
            </Link>
            <Link
              href="/howItWorks"
              className={`hover:underline hover:font-bold ${isActive("/howItWorks") ? "underline font-bold" : ""
                }`}
            >
              How it Works
            </Link>
            <Link
              href="/pricing"
              className={`hover:underline hover:font-bold ${isActive("/pricing") ? "underline font-bold" : ""
                }`}
            >
              Pricing
            </Link>
            <Link
              href="/blogs"
              className={`hover:underline hover:font-bold ${isActive("/blogs") ? "underline font-bold" : ""
                }`}
            >
              Blogs
            </Link>
            <Link
              href="/PrivacyPolicy"
              className={`hover:underline hover:font-bold ${isActive("/PrivacyPolicy") ? "underline font-bold" : ""
                }`}
            >
              Privacy Policy
            </Link>
            <Link
              href="/OurStory"
              className={`hover:underline hover:font-bold ${isActive("/OurStory") ? "underline font-bold" : ""
                }`}
            >
              Our Story
            </Link>
            <Link
              href="/search"
              className={`hover:underline hover:font-bold ${isActive("/search") ? "underline font-bold" : ""
                }`}
            >
              Find investors
            </Link>
          </ul>
        </div>
        {isLoggedIn ? (
          <div
            ref={profileRef}
            className="relative flex gap-5 cursor-pointer items-center max-md:hidden"
            onClick={toggleLogout}
            
          >
            <div className="flex items-center gap-2">
            <Image
              src={avatarURL || profile}
              alt="Profile"
              className="rounded-full h-10 w-10 object-cover cursor-pointer"
              width={40}
              height={40}
            
            />
              {
                firstName ? <p className="text-black">{firstName}</p> : <p className="text-black">Profile</p>
              }
              <IoMdArrowDropdown size={25} className="text-blue-300"/>
          </div>
            {showLogout && (
              <div className="absolute top-[120%]  right-0 bg-white text-black border shadow-md px-8 py-2 rounded-md flex flex-col items-center gap-2 w-[230px]">
              
                <div className="flex flex-col gap-2">
                  <ul className="flex flex-col items-start gap-2 text-black">

                    <Link href="/profile">Profile</Link>

                  </ul>

                  <Separator />

                  {role === "Visa Sponsor" && (
                    <>
                      <ul className="flex flex-col items-start gap-2 text-black">
                        <Link href="/manage-listing">Manage/Create Your Listing</Link>
                      </ul>
                      <Separator />
                      <ul className="flex flex-col items-start gap-2 text-black">
                        <Link href="/billing">Billing Dashboard</Link>
                      </ul>
                      <Separator />
                    </>
                  )}

                  <div className="flex gap-2 items-center">
                    <button onClick={logout} className="text-black">
                      Logout
                    </button>
                    <LogOut size={14} color="white" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-5 items-center max-md:hidden">
            <Link
              href="/sign-up"
              className="bg-green-500 hover:bg-green-400 text-white px-6 py-3 rounded-sm font-bold"
            >
              Sign up
            </Link>
            <Link
              href="/sign-in"
              className="bg-blue-300 hover:bg-blue-300 text-black px-6 py-3 rounded-sm font-bold"
            >
              Login
            </Link>
          </div>
        )}

        <div className="md:hidden flex gap-4">
          {isLoggedIn ? (
            <div className="flex gap-5 items-center relative">
              <Image
                src={avatarURL || profile}
                alt="Profile"
                className="rounded-full"
                width={40}
                height={40}
                onClick={toggleLogout}
              />
              {showLogout && (
                <div className="absolute top-[120%] right-0 bg-white text-black border shadow-md px-8 py-2 rounded-md flex flex-col items-center gap-2 w-[230px]">
                  <p className="font-bold text-lg">{firstName} {lastName}</p>
                  <div className="flex flex-col gap-2">
                    <ul className="flex flex-col items-start gap-2 text-black">
                      <Link href="/profile">Profile</Link>
                    </ul>
                    {role === "Visa Sponsor" && (
                      <ul className="flex flex-col items-start gap-2 text-black">
                        <Link href="/manage-listing">Manage Your Listings </Link>
                      </ul>
                    )}
                    <ul className="flex flex-col items-start gap-2 text-black">
                      <Link href="/billing">Billing</Link>
                    </ul>
                    <div className="flex gap-2 items-center">
                      <button onClick={logout} className="text-black">
                        Logout
                      </button>
                      <LogOut size={14} color="white" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            ""
          )}

          <Sheet>
            <SheetTrigger className="p-3 bg-blue-400 rounded-full">
              <RiMenuLine size={20} color="white" />
            </SheetTrigger>
            <SheetContent className="bg-white">
              <SheetHeader>
                <SheetTitle className="sr-only">Menu</SheetTitle>
              </SheetHeader>
              <ul className="flex flex-col gap-5 items-left">
                <Link
                  href="/"
                  className={isActive("/") ? "underline font-bold" : ""}
                >
                  Home
                </Link>
                <Link
                  href="/howItWorks"
                  className={
                    isActive("/howItWorks") ? "underline font-bold" : ""
                  }
                >
                  How it Works
                </Link>
                <Link
                  href="/pricing"
                  className={isActive("/pricing") ? "underline font-bold" : ""}
                >
                  Pricing
                </Link>
                <Link
                  href="/blogs"
                  className={isActive("/blogs") ? "underline font-bold" : ""}
                >
                  Blogs
                </Link>
                <Link
                  href="/OurStory"
                  className={isActive("/OurStory") ? "underline font-bold" : ""}
                >
                  Our Story
                </Link>
                <Link
                  href="/PrivacyPolicy"
                  className={
                    isActive("/PrivacyPolicy") ? "underline font-bold" : ""
                  }
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/search"
                  className={`hover:underline hover:font-bold ${isActive("/search") ? "underline font-bold" : ""
                    }`}
                >
                  Find investors
                </Link>
                {isLoggedIn ? (
                  <button
                    className="border border-black text-black hover:bg-black hover:text-white px-6 py-3 rounded-full font-bold text-[18px]"
                    onClick={logout}
                  >
                    Logout
                  </button>
                ) : (
                  <div className="flex flex-col gap-5 items-center ">
                  <Link
                    href="/sign-up"
                    className="bg-green-500 w-full text-center hover:bg-green-400 text-white px-6 py-3 rounded-sm font-bold"
                  >
                    Sign up
                  </Link>
                  <Link
                    href="/sign-in"
                    className="bg-blue-300 w-full text-center hover:bg-blue-300 text-black px-6 py-3 rounded-sm font-bold"
                  >
                    Login
                  </Link>
                </div>
                )}
              </ul>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
