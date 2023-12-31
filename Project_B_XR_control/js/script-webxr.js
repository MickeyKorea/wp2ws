let controller1, controller2;
let controllerGrip1, controllerGrip2;

function setupWebXR() {
  renderer.xr.enabled = true;

  // controller 
  controller1 = renderer.xr.getController(0);
  controller1.addEventListener('selectstart', onSelectStart); // when the trigger is pressed
  controller1.addEventListener('selectend', onSelectEnd); // when the trigger is released
  controller1.addEventListener("axischange", onAxisChange); // when the joystick is moved
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  controller2.addEventListener('selectstart', onSelectStart);
  controller2.addEventListener('selectend', onSelectEnd);
  controller2.addEventListener("axischange", onAxisChange);
  scene.add(controller2);

  // controller grip
  const controllerModelFactory = new XRControllerModelFactory();

  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
  scene.add(controllerGrip1);

  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
  scene.add(controllerGrip2);

  // display the XR Button
  document.body.appendChild(XRButton.createButton(renderer));

  // controllers and raycaster
  const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, - 1)]);

  const line = new THREE.Line(geometry);
  line.name = 'line';
  line.scale.z = 5;

  controller1.add(line.clone());
  controller2.add(line.clone());

  raycaster = new THREE.Raycaster();
}

function onSelectStart(event) {

  const controller = event.target;

  const intersections = getIntersections(controller);

  if (intersections.length > 0) {

    const intersection = intersections[0];

    const object = intersection.object;
    object.material.emissive.b = 1;
    controller.attach(object);

    controller.userData.selected = object;

  }

  controller.userData.targetRayMode = event.data.targetRayMode;

}

function onSelectEnd(event) {

  const controller = event.target;

  if (controller.userData.selected !== undefined) {

    const object = controller.userData.selected;
    object.material.emissive.b = 0;
    group.attach(object);

    controller.userData.selected = undefined;

  }

}

function onAxisChange(event) {
  // Check if the axis change is on the joystick
  const joystickThreshold = 0.5; // You can adjust this threshold
  const xAxis = event.axes[2]; // X-axis of the joystick
  const yAxis = event.axes[3]; // Y-axis of the joystick

  // Check if the joystick is moved beyond the threshold
  if (Math.abs(xAxis) > joystickThreshold || Math.abs(yAxis) > joystickThreshold) {
    // Determine the direction based on the joystick position
    if (xAxis > joystickThreshold) {
      // Joystick moved right
    } else if (xAxis < -joystickThreshold) {
      // Joystick moved left
    }

    if (yAxis > joystickThreshold) {
      // Joystick moved down
    } else if (yAxis < -joystickThreshold) {
      // Joystick moved up
      text_rotate = true;
    }
  }
}