import { assert } from "@ember/debug";
import EngineInstance from "@ember/engine/instance";
import { getOwner } from "@ember/application";

EngineInstance.reopen({
  /**
    The root DOM element of the `EngineInstance` as an element or a
    [jQuery-compatible selector
    string](http://api.jquery.com/category/selectors/).

    @private
    @property {String|DOMElement} rootElement
  */
  rootElement: null,

  /**
    A mapping of dependency names and values, grouped by category.

    `dependencies` should be set by the parent of this engine instance upon
    instantiation and prior to boot.

    During the boot process, engine instances verify that their required
    dependencies, as defined on the parent `Engine` class, have been assigned
    by the parent.

    @private
    @property {Object} dependencies
  */
  dependencies: null,

  /**
    A cache of dependency names and values, grouped by engine name.

    This cache is maintained by `buildChildEngineInstance()` for every engine
    that's a child of this parent instance.

    Only dependencies that are singletons are currently allowed, which makes
    this safe.

    @private
    @property {Object} _dependenciesForChildEngines
  */
  _dependenciesForChildEngines: null,

  buildChildEngineInstance(name, options = {}) {
    return this._super(name, options);
  },

  /*
    Gets the application-scoped route path for an external route.

    @private
    @method _getExternalRoute
    @param {String} routeName
    @return {String} route
  */
  _getExternalRoute(routeName) {
    return routeName;
  },

  lookup(fullName, options) {
    const owner = getOwner(this.base);
    if (owner) {
      this.__registry__.validateInjections = function(injections) {
        if (injections) {
          for (let i = 0; i < injections.length; i++) {
            let { specifier } = injections[i];

            const dependency = owner.lookup(specifier, options);
            try {
              this.register(specifier, dependency, { instantiate: false });
            } catch (e) {}
          }
        }
        return true;
      };
    }

    if (fullName.indexOf("service") === 0 && owner) {
      this._clonedDependencies = this._clonedDependencies || {};
      if (!this._clonedDependencies[fullName]) {
        const dependency = owner.lookup(fullName, options);
        try {
          this.register(fullName, dependency, { instantiate: false });
        } catch (e) {}
        this._clonedDependencies[fullName] = true;
      }
    }

    return this._super(fullName, options);
  },

  cloneParentDependencies() {
    this._super();
  },

  _dependencyTypeFromCategory(category) {
    switch (category) {
      case "services":
        return "service";
      case "externalRoutes":
        return "externalRoute";
    }
    assert(
      `Dependencies of category '${category}' can not be shared with engines.`,
      false
    );
  },

  mount(view) {
    assert('EngineInstance must be booted before it can be mounted', this._booted);
  
    view.append()
  },

  /**
    This hook is called by the root-most Route (a.k.a. the ApplicationRoute)
    when it has finished creating the root View. By default, we simply take the
    view and append it to the `rootElement` specified on the Application.

    In cases like FastBoot and testing, we can override this hook and implement
    custom behavior, such as serializing to a string and sending over an HTTP
    socket rather than appending to DOM.

    @param view {Ember.View} the root-most view
    @private
  */
  didCreateRootView(view) {
    view.appendTo(this.rootElement);
  }
});
