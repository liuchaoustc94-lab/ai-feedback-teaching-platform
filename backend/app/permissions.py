from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Optional


MODULE_KEYS = (
    "information-processing",
    "sensory-proprioception",
    "attention-allocation",
    "motor-coordination",
    "feedback-motor-learning",
    "data-center",
    "training-archive",
)

MODULE_LABELS = {
    "information-processing": "信息加工",
    "sensory-proprioception": "感觉系统与本体感觉",
    "attention-allocation": "注意力分配",
    "motor-coordination": "动作协调与控制",
    "feedback-motor-learning": "反馈与运动学习",
    "data-center": "数据中心",
    "training-archive": "我的训练档案",
}

FUNCTION_MODULES = {
    "F1.1": "information-processing",
    "F1.2": "information-processing",
    "F2.1": "sensory-proprioception",
    "F2.2": "sensory-proprioception",
    "F2.3": "sensory-proprioception",
    "F3.1": "attention-allocation",
    "F4.1": "motor-coordination",
    "F4.2": "motor-coordination",
    "F5.1": "feedback-motor-learning",
    "F5.2": "feedback-motor-learning",
    "F5.3": "feedback-motor-learning",
}


@dataclass(frozen=True)
class EffectivePermissions:
    modules: set[str]
    can_download: bool


def effective_permissions(
    role: str,
    allowed_modules: Iterable[str],
    can_download: bool,
) -> EffectivePermissions:
    if role == "admin":
        return EffectivePermissions(set(MODULE_KEYS), True)
    return EffectivePermissions(
        {module for module in allowed_modules if module in MODULE_LABELS},
        bool(can_download),
    )


def module_allowed(role: str, allowed_modules: Iterable[str], module_key: str) -> bool:
    if module_key not in MODULE_LABELS:
        return False
    return effective_permissions(role, allowed_modules, False).modules.__contains__(module_key)


def module_for_function(function_code: str) -> Optional[str]:
    return FUNCTION_MODULES.get(function_code)
