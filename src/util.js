// Constantes et petits utilitaires partagés.
import * as THREE from 'three';


export const V3 = THREE.Vector3;
export const DEG = Math.PI / 180;
export const UP = new V3(0, 1, 0);
export const WALL_T = 0.2;
export const ISO_POLAR = Math.acos(1 / Math.sqrt(3));
export const STORE_KEY = 'homegym-studio.v1';
export const SIDES = ['N', 'E', 'S', 'W'];
export const SIDE_NAME = { N: 'nord', E: 'est', S: 'sud', W: 'ouest' };
export const SIDE_FROM = { N: "depuis l'angle ouest", S: "depuis l'angle ouest", E: "depuis l'angle nord", W: "depuis l'angle nord" };

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const uid = () => Math.random().toString(36).slice(2, 9);
export const cm = (m) => Math.round(m * 100);
export const snap = (v, s) => Math.round(v / s) * s;
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const euro = (n) => Math.round(n).toLocaleString('fr-FR') + ' €';
export const num = (v, def) => (Number.isFinite(+v) ? +v : def);
export const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
