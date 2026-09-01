typedef ShellNavHandler = void Function(String label);

/// Lets dashboard CTAs jump to a shell tab without restructuring routing.
class ShellNavigation {
  static ShellNavHandler? _handler;

  static void bind(ShellNavHandler handler) => _handler = handler;

  static void unbind() => _handler = null;

  static void go(String label) => _handler?.call(label);
}
