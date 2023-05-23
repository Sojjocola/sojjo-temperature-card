# Sojjo Temperature gauge Card by [@Sojjocola](https://github.com/Sojjocola)

Home Assistant Lovelace custom cards to display a gauge with one or two entities to link.

[![GitHub Release][releases-shield]][releases]
[![License][license-shield]](LICENSE.md)

## Options

| Name              | Type    | Requirement  | Description                                 | Default             |
| ----------------- | ------- | ------------ | ------------------------------------------- | ------------------- |
| type              | string  | **Required** | `custom:sojjotemperature-card`              |                     |
| name              | string  | **Optional** | Card name                                   |                     |
| show_error        | boolean | **Optional** | Show what an error looks like for the card  | `false`             |
| show_warning      | boolean | **Optional** | Show what a warning looks like for the card | `false`             |
| entity            | string  | **Required** | Home Assistant entity ID.                   | `none`              |
| second_entity     | string  | **Optional** | Home Assistant entity ID.                   | `none`              |
| with_second_entity| boolean | **Optional** | Show and link a secondary entity.           | `none`              |
| tap_action        | object  | **Optional** | Action to take on tap                       | `action: more-info` |
| hold_action       | object  | **Optional** | Action to take on hold                      | `none`              |
| double_tap_action | object  | **Optional** | Action to take on double tap                | `none`              |      |

## configuration example





```


