"use client";

import { useEffect, useLayoutEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuthInitializer({ initialUser }) {
  // Chạy đồng bộ trước khi browser paint → xoá flash trạng thái sai
  useLayoutEffect(() => {
    useAuthStore.setState({
      user: initialUser ?? null,
      isLoading: false,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Chạy full init để thiết lập onAuthStateChange listener + fetch profile
    useAuthStore.getState().init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
