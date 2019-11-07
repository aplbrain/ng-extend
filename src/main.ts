require('neuroglancer/ui/default_viewer.css');
require('./main.css');

import 'neuroglancer/sliceview/chunk_format_handlers';

import {setDefaultInputEventBindings} from 'neuroglancer/ui/default_input_event_bindings';
import {disableContextMenu, disableWheel} from 'neuroglancer/ui/disable_default_actions';
import {DisplayContext} from 'neuroglancer/display_context';
import {StatusMessage} from 'neuroglancer/status';
import {Viewer} from 'neuroglancer/viewer';

import {bindDefaultCopyHandler, bindDefaultPasteHandler} from 'neuroglancer/ui/default_clipboard_handling';
import {UrlHashBinding} from 'neuroglancer/ui/url_hash_binding';

import {setupVueApp} from './vueapp';

window.addEventListener('DOMContentLoaded', () => {
  setupVueApp();
  setupViewer();
});

function setupViewer() {
  let viewer = (<any>window)['viewer'] = makeExtendViewer();
  setDefaultInputEventBindings(viewer.inputEventBindings);

  const hashBinding = viewer.registerDisposer(new UrlHashBinding(viewer.state));
  viewer.registerDisposer(hashBinding.parseError.changed.add(() => {
    const {value} = hashBinding.parseError;
    if (value !== undefined) {
      const status = new StatusMessage();
      status.setErrorMessage(`Error parsing state: ${value.message}`);
      console.log('Error parsing state', value);
    }
    hashBinding.parseError;
  }));
  hashBinding.updateFromUrlHash();

  viewer.loadFromJsonUrl();

  bindDefaultCopyHandler(viewer);
  bindDefaultPasteHandler(viewer);

  return viewer;
}

function makeExtendViewer() {
  disableContextMenu();
  disableWheel();
  try {
    let display = new DisplayContext(document.getElementById('neuroglancer-container')!);
    return new ExtendViewer(display);
  } catch (error) {
    StatusMessage.showMessage(`Error: ${error.message}`);
    throw error;
  }
}

import {authTokenShared} from "neuroglancer/authentication/frontend";
import { storeProxy } from './state';

class ExtendViewer extends Viewer {
  constructor(public display: DisplayContext) {
    super(display);
    authTokenShared!.changed.add(() => {
      storeProxy.fetchLoggedInUser();
    });
    storeProxy.fetchLoggedInUser();
  }
}
