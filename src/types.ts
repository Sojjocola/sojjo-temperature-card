import { ActionConfig, LovelaceCard, LovelaceCardConfig, LovelaceCardEditor } from 'custom-card-helpers';
import { SojjoTemperatureGauge } from './sojjotemperature-card';

declare global {
  interface HTMLElementTagNameMap {
    'sojjotemperature-card-editor': LovelaceCardEditor;
    'hui-error-card': LovelaceCard;
    'sojjo-temperature-gauge': SojjoTemperatureGauge;
  }
}

// TODO Add your configuration elements here for type-checking
export interface SojjoTemperatureCardConfig extends LovelaceCardConfig {
  type: string;
  name: string;
  show_warning?: boolean;
  show_error?: boolean;
  test_gui?: boolean;
  entity: string;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
  with_second_entity: boolean;
  second_entity?: string;
  resolution?: number;
  gaugeColor?: GaugeColor;
  firstUnit?: string;
  secondUnit?: string;
  firstIcon?: string;
  secondIcon?: string;
  firstIconColor?: string;
  secondIconColor?: string;
}

export interface GaugeColor {
  green: number;
  yellow: number;
  red: number;
}
