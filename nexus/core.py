"""Model-independent, deterministic behavior for the first NEXUS boot."""


def builtin_reply(message: str, nexus_name: str = "NEXUS") -> str:
    """Return an honest local response without pretending to be a language model."""
    command = message.strip().casefold()

    if command in {"/help", "помощь", "помоги"}:
        return (
            f"{nexus_name}: встроенный режим активен.\n"
            "Доступные команды:\n"
            "/help — показать эту справку\n"
            "/status — проверить состояние базового ядра\n"
            "Свободный диалог пока ограничен: для генеративных ответов "
            "нужно подключить совместимую языковую модель."
        )

    if command in {"/status", "статус"}:
        return (
            f"{nexus_name}: базовое ядро работает.\n"
            "Режим: встроенный детерминированный.\n"
            "Языковая модель: не подключена.\n"
            "История диалога: сохраняется локально в SQLite."
        )

    return (
        f"{nexus_name} получил сообщение: «{message.strip()}»\n\n"
        "Сейчас я работаю во встроенном режиме без языковой модели. "
        "Я могу проверить состояние ядра и показать справку командами "
        "/status и /help, но пока не умею вести полноценный свободный диалог. "
        "Подключение модели остаётся необязательным расширением."
    )
