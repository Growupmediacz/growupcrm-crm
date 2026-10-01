<template>
  <!-- GrowUp: ikona značky (G se zelenou šipkou růstu), shodná s growupcrm/public/brand/logo-mark.svg -->
  <svg
    width="64"
    height="64"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="GrowUpCRM"
  >
    <defs>
      <linearGradient :id="`gm-${uid}`" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#6E6AF6" />
        <stop offset=".55" stop-color="#4F46E5" />
        <stop offset="1" stop-color="#3B32C4" />
      </linearGradient>
      <linearGradient :id="`gh-${uid}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".38" />
        <stop offset=".5" stop-color="#fff" stop-opacity="0" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="15" :fill="`url(#gm-${uid})`" />
    <rect
      x=".75"
      y=".75"
      width="62.5"
      height="62.5"
      rx="14.4"
      :fill="`url(#gh-${uid})`"
      stroke="#fff"
      stroke-opacity=".25"
      stroke-width="1.5"
    />
    <g transform="translate(-3 1.6)">
      <path
        d="M37.3 20.6 A14.5 14.5 0 1 0 46.5 35 L37.5 35"
        stroke="#fff"
        stroke-width="6.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M46.5 35 V13.8 M40.4 19.9 L46.5 13.8 L52.6 19.9"
        stroke="#5EE6A0"
        stroke-width="6.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>
  </svg>
</template>

<script setup>
// Gradienty potřebují jedinečné id, logo bývá na stránce víckrát.
const uid = Math.random().toString(36).slice(2, 8)
</script>
