"use client";

import { useEffect } from "react";

import { initializeRUM } from "../lib/apm-rum";

export default function ElasticRUM() {
  useEffect(() => {
    initializeRUM();
  }, []);

  return null;
}