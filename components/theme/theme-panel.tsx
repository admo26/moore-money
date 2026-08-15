"use client";

import { Palette } from "lucide-react";
import type { Selection } from "react-aria-components";
import { Popover, PopoverContent, PopoverTrigger } from "@heroui/react/popover";
import { ToggleButtonGroup } from "@heroui/react/toggle-button-group";
import { ToggleButton } from "@heroui/react/toggle-button";
import { Slider } from "@heroui/react/slider";
import { useTheme } from "@/components/theme/theme-provider";
import { ACCENT_PRESETS, MAX_RADIUS, MIN_RADIUS, RADIUS_STEP, type ThemeScheme } from "@/lib/theme";

/**
 * Floating live theme selector for the HeroUI Dashboard pilot — accent,
 * radius, and light/dark, in the spirit of heroui.com's own theme builder.
 * Every change applies immediately (via useTheme -> ThemeProvider) and
 * persists to a cookie so it survives a reload.
 */
export function ThemePanel() {
  const { theme, setTheme } = useTheme();

  function handleSchemeChange(keys: Selection) {
    if (keys === "all") return;
    const key = keys.values().next().value as ThemeScheme | undefined;
    if (key) setTheme({ ...theme, scheme: key });
  }

  function handleAccentChange(keys: Selection) {
    if (keys === "all") return;
    const key = keys.values().next().value as string | undefined;
    if (key) setTheme({ ...theme, accent: key });
  }

  function handleRadiusChange(value: number | number[]) {
    const radius = Array.isArray(value) ? value[0] : value;
    setTheme({ ...theme, radius });
  }

  return (
    <Popover>
      <PopoverTrigger className="fixed bottom-4 right-4 z-50 inline-flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105">
        <Palette className="h-5 w-5" />
        <span className="sr-only">Open theme selector</span>
      </PopoverTrigger>
      <PopoverContent placement="top end">
        <div className="w-64 space-y-4 p-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Theme</h2>
            <p className="text-xs text-muted-foreground">Pilot-only — try the HeroUI look.</p>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Appearance</span>
            <ToggleButtonGroup
              aria-label="Appearance"
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[theme.scheme]}
              onSelectionChange={handleSchemeChange}
              fullWidth
            >
              <ToggleButton id="light" className="flex-1">
                Light
              </ToggleButton>
              <ToggleButton id="dark" className="flex-1">
                Dark
              </ToggleButton>
            </ToggleButtonGroup>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Accent</span>
            <ToggleButtonGroup
              aria-label="Accent color"
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[theme.accent]}
              onSelectionChange={handleAccentChange}
              isDetached
              className="flex flex-wrap gap-1.5"
            >
              {ACCENT_PRESETS.map((preset) => (
                <ToggleButton
                  key={preset.key}
                  id={preset.key}
                  aria-label={preset.label}
                  className="size-7 rounded-full p-0 ring-offset-2 selected:ring-2 selected:ring-foreground/40"
                  style={{ backgroundColor: preset.swatch }}
                />
              ))}
            </ToggleButtonGroup>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Radius</span>
              <span className="text-xs text-muted-foreground">{theme.radius.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}rem</span>
            </div>
            <Slider
              aria-label="Corner radius"
              value={theme.radius}
              onChange={handleRadiusChange}
              minValue={MIN_RADIUS}
              maxValue={MAX_RADIUS}
              step={RADIUS_STEP}
            >
              <Slider.Track>
                <Slider.Fill />
                <Slider.Thumb />
              </Slider.Track>
            </Slider>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
