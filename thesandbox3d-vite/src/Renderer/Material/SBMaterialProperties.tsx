import * as THREE from 'three';
import { GetHexColorFromThreeColor } from '../../Maths/SBColor';

/** Supported field control types for the UI renderer */
export type MaterialControlGroup =
  | 'color'
  | 'number'
  | 'boolean'
  | 'texture'
  | 'vector2'
  | 'vector3'
  | 'select'
  | 'undefined';

/** Normalized schema item consumed by dynamic UI components */
export interface MaterialFieldSchema {
  key: string;
  label: string;
  type: MaterialControlGroup;
  value: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: any }[];
  isUniform?: boolean;
}

/** Properties to ignore during top-level material reflection */
const EXCLUDED_KEYS = new Set([
  'isMaterial',
  'id',
  'uuid',
  'name',
  'type',
  'version',
  'needsUpdate',
  'visible',
  'userData',
  'program',
  'defines',
  'uniforms',
  'uniformsNeedUpdate',
  'extensions',
  'clippingPlanes',
  'stencilWrite',
  'stencilRef',
  'stencilFunc',
  'stencilFail',
  'stencilZFail',
  'stencilZPass',
  'blending',
  'blendSrc',
  'blendDst',
  'blendEquation',
  'depthFunc',
  'stencilWriteMask',
  'stencilFuncMask',
  'transparent', //users dont need to see this, it is derived from opacity
  'alphaHash',
  'side'
]);

/** Standard PBR property range hints */
function getRangeHints(key: string): { min: number; max: number; step: number } 
{
  const k = key.toLowerCase();
  if (k.includes('roughness') || k.includes('metalness') 
    || k.includes('opacity') || k.includes('transmission') 
  || k.includes('clearcoat') || k.includes('ior') === false 
  && k.includes('alpha')) {
    return { min: 0, max: 1, step: 0.01 };
  }
  if (k.includes('ior')) {
    return { min: 1, max: 2.33, step: 0.01 };
  }
  if (k.includes('scale') || k.includes('intensity')) {
    return { min: 0, max: 10, step: 0.1 };
  }
  return { min: 0, max: 100, step: 0.1 };
}

/** Formats camelCase string keys into human-readable labels */
function formatLabel(key: string): string {
  const result = key.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * Scans any Three.js Material or ShaderMaterial instance and outputs
 * a normalized schema list for dynamic UI rendering.
 */
export function inspectMaterialSchema(
  rawMaterial: THREE.Material | THREE.Material[]
): MaterialFieldSchema[] {
  if (!rawMaterial) return [];

  const mat = Array.isArray(rawMaterial) ? rawMaterial[0] : rawMaterial;
  const schema: MaterialFieldSchema[] = [];

  // =========================================================================
  // CASE A: Custom Shader Material (Introspects `material.uniforms`)
  // =========================================================================
  if (mat instanceof THREE.ShaderMaterial || mat instanceof THREE.RawShaderMaterial) {
    const uniforms = mat.uniforms || {};

    Object.keys(uniforms).forEach((key) => {
      // Ignore system uniforms used by render loops
      if (['uTime', 'time', 'resolution', 'cameraPosition', 'viewMatrix'
      ].includes(key)) return;

      

      const u = uniforms[key];
      if (!u || u.value === undefined || u.value === null) return;

      const val = u.value;
      const label = formatLabel(key);

      // 1. Color Uniform
      if (val instanceof THREE.Color) {
        schema.push({ key, label, type: 'color', value: val, isUniform: true });
      }
      // 2. Scalar Number Uniform
      else if (typeof val === 'number') {
        const hints = getRangeHints(key);
        schema.push({ key, label, type: 'number', value: val, ...hints, isUniform: true });
      }
      // 3. Boolean Uniform
      else if (typeof val === 'boolean') {
        schema.push({ key, label, type: 'boolean', value: val, isUniform: true });
      }
      // 4. Texture Uniform
      else if (val instanceof THREE.Texture) {
        schema.push({ key, label, type: 'texture', value: val, isUniform: true });
      }
      // 5. Vector Uniforms
      else if (val instanceof THREE.Vector2) {
        schema.push({ key, label, type: 'vector2', value: val, isUniform: true });
      } else if (val instanceof THREE.Vector3) {
        schema.push({ key, label, type: 'vector3', value: val, isUniform: true });
      }
    });

    return schema;
  }

  // =========================================================================
  // CASE B: Standard / Native Three.js Materials (Introspects object properties)
  // =========================================================================
  for (const key of Object.keys(mat)) {
    if (EXCLUDED_KEYS.has(key)) continue;

    const val = (mat as any)[key];
    if (val === undefined || val === null || typeof val === 'function') continue;

    //Ignore '_' prefixed properties (internal use only)
    if (key.startsWith('_')) continue;

    const label = formatLabel(key);

    // 1. Color Property
    if (val instanceof THREE.Color) {
      schema.push({ key, label, type: 'color', value: GetHexColorFromThreeColor(val) });
    }
    // 2. Scalar Number Property
    else if (typeof val === 'number') {
      const hints = getRangeHints(key);
      schema.push({ key, label, type: 'number', value: val, ...hints });
    }
    // 3. Boolean Property
    else if (typeof val === 'boolean') {
      schema.push({ key, label, type: 'boolean', value: val });
    }
    // 4. Texture Slot Property
    else if (val instanceof THREE.Texture) {
      schema.push({ key, label, type: 'texture', value: val });
    }
    // 5. Vector Properties
    else if (val instanceof THREE.Vector2) {
      schema.push({ key, label, type: 'vector2', value: val });
    }
  }

  // Handle Material Side selection (FrontSide, BackSide, DoubleSide)
  schema.push({
    key: 'side',
    label: 'Render Side',
    type: 'select',
    value: mat.side,
    options: [
      { label: 'Front', value: THREE.FrontSide },
      { label: 'Back', value: THREE.BackSide },
      { label: 'Double', value: THREE.DoubleSide },
    ],
  });

  return schema;
}

/**
 * Universal Mutation Function: Applies value changes to either
 * top-level properties or ShaderMaterial uniforms correctly.
 */
export function updateMaterialProperty(
  material: THREE.Material,
  field: MaterialFieldSchema,
  newValue: any
) {
  const mat = Array.isArray(material) ? material[0] : material;

  if (field.isUniform && 'uniforms' in mat) {
    const u = (mat as THREE.ShaderMaterial).uniforms[field.key];
    if (u) {
      if (field.type === 'color' && u.value instanceof THREE.Color) {
        u.value.set(newValue);
      } else {
        u.value = newValue;
      }
    }
  } else {
    if (field.type === 'color' && (mat as any)[field.key] instanceof THREE.Color) {
      (mat as any)[field.key].set(newValue);
    } else {
      (mat as any)[field.key] = newValue;
    }

    if (field.key === 'opacity') {
      mat.transparent = newValue < 1;
    }
  }

  mat.needsUpdate = true;
}