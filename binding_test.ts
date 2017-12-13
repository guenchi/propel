import { binding, ctx } from "./tf";
import { assert, assertAllEqual, assertEqual } from "./util";

function testEquals() {
  const a = new binding.Handle(new Float32Array([2, 5]), [2], binding.TF_FLOAT);
  const b = new binding.Handle(new Float32Array([2, 4]), [2], binding.TF_FLOAT);

  const opAttrs = [
    ["T", binding.ATTR_TYPE, binding.TF_FLOAT],
  ];
  const r = binding.execute(ctx, "Equal", opAttrs, [a, a])[0];
  assert(binding.getDevice(r) === "CPU:0");
  assertAllEqual(binding.getShape(r), [2]);

  const result = Array.from(new Uint8Array(binding.asArrayBuffer(r)));
  assertAllEqual(result, [1, 1]);

  const r2 = binding.execute(ctx, "Equal", opAttrs, [a, b])[0];
  const result2 = Array.from(new Uint8Array(binding.asArrayBuffer(r2)));
  assertAllEqual(result2, [1, 0]);
}

function testMatMul() {
  assert(ctx instanceof binding.Context);

  const typedArray = new Float32Array([1, 2, 3, 4, 5, 6]);
  const a = new binding.Handle(typedArray, [2, 3], binding.TF_FLOAT);
  const b = new binding.Handle(typedArray, [3, 2], binding.TF_FLOAT);
  assert(binding.getDevice(a) === "CPU:0");
  assert(binding.getDevice(b) === "CPU:0");
  assertAllEqual(binding.getShape(a), [2, 3]);
  assertAllEqual(binding.getShape(b), [3, 2]);

  const opAttrs = [
    ["transpose_a", binding.ATTR_BOOL, false],
    ["transpose_b", binding.ATTR_BOOL, false],
    ["T", binding.ATTR_TYPE, binding.TF_FLOAT],
  ];
  const retvals = binding.execute(ctx, "MatMul", opAttrs, [a, b]);
  const r = retvals[0];
  assert(binding.getDevice(r) === "CPU:0");
  const result = Array.from(new Float32Array(binding.asArrayBuffer(r)));
  assertAllEqual(result, [22, 28, 49, 64]);
}

function testMul() {
  const typedArray = new Float32Array([2, 5]);
  const a = new binding.Handle(typedArray, [2], binding.TF_FLOAT);
  const b = new binding.Handle(typedArray, [2], binding.TF_FLOAT);
  assert(binding.getDevice(a) === "CPU:0");
  assert(binding.getDevice(b) === "CPU:0");

  assert(binding.getDType(a) === binding.TF_FLOAT);
  assert(binding.getDType(b) === binding.TF_FLOAT);

  const opAttrs = [
    ["T", binding.ATTR_TYPE, binding.TF_FLOAT],
  ];
  const retvals = binding.execute(ctx, "Mul", opAttrs, [a, b]);
  const r = retvals[0];
  assert(binding.getDevice(r) === "CPU:0");
  const result = Array.from(new Float32Array(binding.asArrayBuffer(r)));
  assertAllEqual(result, [4, 25]);
}

function testChaining() {
  // Do an Equal followed by ReduceAll.
  const a = new binding.Handle(new Float32Array([2, 5]), [2], binding.TF_FLOAT);
  const b = new binding.Handle(new Float32Array([2, 4]), [2], binding.TF_FLOAT);

  const opAttrs = [
    ["T", binding.ATTR_TYPE, binding.TF_FLOAT],
  ];
  const r = binding.execute(ctx, "Equal", opAttrs, [a, a])[0];
  assert(binding.getDType(r) === binding.TF_BOOL);
  assertAllEqual(binding.getShape(r), [2]);

  const reductionIndices = new binding.Handle(new Int32Array([0]), [1],
                                              binding.TF_INT32);
  const opAttrs2 = [
    ["Tidx", binding.ATTR_TYPE, binding.TF_INT32],
    ["keep_dims", binding.ATTR_BOOL, false],
  ];
  const r2 = binding.execute(ctx, "All", opAttrs2, [r, reductionIndices])[0];
  const result2 = Array.from(new Uint8Array(binding.asArrayBuffer(r2)));
  assertAllEqual(result2, [1]);
}

function testReshape() {
  const typedArray = new Float32Array([1, 2, 3, 4, 5, 6]);
  const t = new binding.Handle(typedArray, [2, 3], binding.TF_FLOAT);
  const shape = new binding.Handle(new Int32Array([3, 2]), [2],
                                   binding.TF_INT32);
  const opAttrs = [
    ["T", binding.ATTR_TYPE, binding.TF_FLOAT],
    ["Tshape", binding.ATTR_TYPE, binding.TF_INT32],
  ];
  const r = binding.execute(ctx, "Reshape", opAttrs, [t, shape])[0];
  assertAllEqual(binding.getShape(r), [3, 2]);
}

function testBoolean() {
  const ta = new Uint8Array([0, 1, 0, 1]);
  const t = new binding.Handle(ta, [3], binding.TF_BOOL);
  assert(binding.getDType(t) === binding.TF_BOOL);
  assertAllEqual(binding.getShape(t), [3]);
  const result = Array.from(new Uint8Array(binding.asArrayBuffer(t)));
  assertAllEqual(result, [0, 1, 0, 1]);
}

testEquals();
testMatMul();
testMul();
testChaining();
testReshape();
testBoolean();
