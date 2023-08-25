import { world } from '@minecraft/server';
import { ChestFormData } from './lib/forms.js';
var CEquipmentSlot;
(function (CEquipmentSlot) {
    CEquipmentSlot["MainHand"] = "mainhand";
    CEquipmentSlot["OffHand"] = "offhand";
    CEquipmentSlot["Head"] = "head";
    CEquipmentSlot["Chest"] = "chest";
    CEquipmentSlot["Legs"] = "legs";
    CEquipmentSlot["Feet"] = "feet";
})(CEquipmentSlot || (CEquipmentSlot = {}));
function getEnchants(iterator) {
    let enchantments = [];
    let nextItem = iterator.next();
    while (!nextItem.done) {
        enchantments.push({
            name: `Enchantment: ${capitalize(nextItem.value.type.id)}`,
            level: nextItem.value.level
        });
        nextItem = iterator.next();
    }
    return enchantments;
}
function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}
world.afterEvents.itemUse.subscribe(evd => {
    // const inventory = evd.source?.getComponent('minecraft:inventory') as EntityInventoryComponent
    // inventory.container.setItem(0, evd.itemStack)
    if (evd.itemStack.typeId !== 'minecraft:compass')
        return;
    primaryMenu(evd.source);
});
function primaryMenu(player) {
    const form = new ChestFormData()
        .title('§l§aMain Menu');
    const allPlayers = world.getAllPlayers();
    for (let i = 0; i < allPlayers.length; i++) {
        form.button(i, `§l§a${allPlayers[i].name}`, [], "minecraft:skull");
    }
    form.show(player).then(response => {
        if (response.canceled)
            return;
        const target = world.getAllPlayers()[response.selection];
        showInventory(player, target);
    });
}
;
function showInventory(player, target) {
    var _a, _b;
    const hotbar = [];
    const inventoryItems = [];
    const offhand = [];
    const armor = [];
    const inventory = target === null || target === void 0 ? void 0 : target.getComponent('minecraft:inventory');
    const container = inventory.container;
    for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i);
        if (!item)
            continue;
        const { nameTag: name, typeId, amount } = item;
        const enchants = item === null || item === void 0 ? void 0 : item.getComponent("enchantments");
        const enchantmentsList = getEnchants(enchants === null || enchants === void 0 ? void 0 : enchants.enchantments[Symbol.iterator]());
        const itemData = {
            name,
            amount,
            typeId,
            slot: i,
            enchantments: enchantmentsList
        };
        const SLOT_RANGES = {
            hotbar: { start: 0, end: 8 },
            inventory: { start: 9, end: 35 }
        };
        if (i >= SLOT_RANGES.hotbar.start && i <= SLOT_RANGES.hotbar.end) {
            hotbar.push(itemData);
        }
        else if (i >= SLOT_RANGES.inventory.start && i <= SLOT_RANGES.inventory.end) {
            inventoryItems.push(itemData);
        }
    }
    const equipmentInventory = target === null || target === void 0 ? void 0 : target.getComponent('equipment_inventory');
    const equipmentSlots = ['offhand', 'head', 'chest', 'legs', 'feet'];
    const equipmentData = {};
    equipmentSlots.forEach(slot => {
        var _a;
        equipmentData[slot] = {
            //@ts-expect-error
            item: (_a = equipmentInventory.getEquipment(slot)) !== null && _a !== void 0 ? _a : null,
            //@ts-expect-error
            enchantments: getEquipmentEnchantments(equipmentInventory.getEquipment(slot))
        };
    });
    if (equipmentData.offhand.item) {
        offhand.push({
            name: equipmentData.offhand.item.nameTag,
            amount: equipmentData.offhand.item.amount,
            typeId: equipmentData.offhand.item.typeId,
            slot: 0,
            enchantments: getEnchants(equipmentData.offhand.enchantments[Symbol.iterator]())
        });
    }
    if (equipmentData.head.item) {
        armor.push({
            name: equipmentData.head.item.nameTag,
            amount: equipmentData.head.item.amount,
            typeId: equipmentData.head.item.typeId,
            slot: 0,
            enchantments: getEnchants(equipmentData.head.enchantments[Symbol.iterator]())
        });
    }
    if (equipmentData.chest.item) {
        armor.push({
            name: equipmentData.chest.item.nameTag,
            amount: equipmentData.chest.item.amount,
            typeId: equipmentData.chest.item.typeId,
            slot: 1,
            enchantments: getEnchants(equipmentData.chest.enchantments[Symbol.iterator]())
        });
    }
    if (equipmentData.legs.item) {
        armor.push({
            name: equipmentData.legs.item.nameTag,
            amount: equipmentData.legs.item.amount,
            typeId: equipmentData.legs.item.typeId,
            slot: 2,
            enchantments: getEnchants(equipmentData.legs.enchantments[Symbol.iterator]())
        });
    }
    if (equipmentData.feet.item) {
        armor.push({
            name: equipmentData.feet.item.nameTag,
            amount: equipmentData.feet.item.amount,
            typeId: equipmentData.feet.item.typeId,
            slot: 3,
            enchantments: getEnchants(equipmentData.feet.enchantments[Symbol.iterator]())
        });
    }
    const form = new ChestFormData('large')
        .title(`§l§a${target.name}'s Inventory`)
        .pattern([0, 0], [
        '_x_______',
        '_x_______',
        '_x_______',
        '________x',
        'xxxxxxxxx',
        '_________',
    ], {
        //@ts-ignore
        x: { data: { itemName: '', itemDesc: [], enchanted: false, stackAmount: 1 }, iconPath: 'minecraft:stained_glass_pane' },
    });
    //armor
    for (let i = 0; i < 4; i++) {
        if (!armor[i]) {
            form.button(i * 9, `§l§cEmpty`, [], "minecraft:barrier");
            continue;
        }
        let enchantmentsStringArray = (_a = armor[i]) === null || _a === void 0 ? void 0 : _a.enchantments.map(enchantment => {
            return `${enchantment.name} (${enchantment.level})`;
        });
        let enchanted = (enchantmentsStringArray === null || enchantmentsStringArray === void 0 ? void 0 : enchantmentsStringArray.length) > 0;
        form.button(i * 9, `${armor[i].name || armor[i].typeId.replace("minecraft:", "").replace("_", " ")}`, enchantmentsStringArray, armor[i].typeId, armor[i].amount, enchanted);
    }
    if (offhand[0]) {
        //offhand
        let enchantmentsStringArray = (_b = offhand[0]) === null || _b === void 0 ? void 0 : _b.enchantments.map(enchantment => {
            return `${enchantment.name} (${enchantment.level})`;
        });
        let enchanted = (enchantmentsStringArray === null || enchantmentsStringArray === void 0 ? void 0 : enchantmentsStringArray.length) > 0;
        form.button(28, `${offhand[0].name || offhand[0].typeId.replace("minecraft:", "").replace("_", " ")}`, [], offhand[0].typeId, offhand[0].amount, enchanted);
    }
    //hotbar + inventory
    for (let i = 0; i < hotbar.length; i++) {
        if (!hotbar[i])
            continue;
        let enchantmentsStringArray = hotbar[i].enchantments.map(enchantment => {
            return `${enchantment.name} (${enchantment.level})`;
        });
        let enchanted = enchantmentsStringArray.length > 0;
        form.button(i + 45, `${hotbar[i].name || hotbar[i].typeId.replace("minecraft:", "").replace("_", " ")}`, enchantmentsStringArray, hotbar[i].typeId, hotbar[i].amount, enchanted);
    }
    // Main Inventory it is suposed to start at slot 2 and then go intill 8 and then from 11 to 17 and then from 20 to 26 and then from 29 to 35 and then from 38 to 44 but we make a formula
    const inventorySlots = getInventorySlots(inventoryItems.length);
    for (let i = 0; i < inventorySlots.length; i++) {
        if (!inventoryItems[i])
            continue;
        let enchantmentsStringArray = inventoryItems[i].enchantments.map(enchantment => {
            return `${enchantment.name} (${enchantment.level})`;
        });
        let enchanted = enchantmentsStringArray.length > 0;
        form.button(inventorySlots[i], `${inventoryItems[i].name || inventoryItems[i].typeId.replace("minecraft:", "").replace("_", " ")}`, enchantmentsStringArray, inventoryItems[i].typeId, inventoryItems[i].amount, enchanted);
    }
    form.show(player).then(response => {
        var _a;
        if (response.canceled)
            return;
        const armorTypeToSlotMapping = {
            helmet: CEquipmentSlot.Head,
            chestplate: CEquipmentSlot.Chest,
            leggings: CEquipmentSlot.Legs,
            boots: CEquipmentSlot.Feet,
            offhand: CEquipmentSlot.OffHand
        };
        for (let armorType in armorTypeToSlotMapping) {
            if ((_a = armor[response.selection / 9]) === null || _a === void 0 ? void 0 : _a.typeId.includes(armorType)) {
                removeArmorMenu(player, target, armorTypeToSlotMapping[armorType]);
                break;
            }
            // if it is the offhand slot then we need to check if the slot is 28
            if (armorType === 'offhand' && response.selection === 28) {
                removeArmorMenu(player, target, armorTypeToSlotMapping[armorType]);
                break;
            }
        }
        //if it is the hotbar get the right item cus for some reason all the slots get pushed forward if its an empty slot
        if (response.selection >= 45 && response.selection <= 53) {
            const item = hotbar[response.selection - 45];
            removeItemMenu(player, target, item.slot);
        }
        //if it is the inventory get the right item cus for some reason all the slots get pushed forward if its an empty slot
        if (response.selection >= 2 && response.selection <= 44) {
            const item = inventoryItems[response.selection - 2];
            removeItemMenu(player, target, item.slot);
        }
    });
}
function removeArmorMenu(player, target, slot) {
    const form = new ChestFormData()
        .title(`§l§aRemove Item`)
        .pattern([0, 0], [
        'xxxxxxxxx',
        'xxx_x_xxx',
        'xxxxxxxxx',
    ], {
        //@ts-ignore
        x: { data: { itemName: '', itemDesc: [], enchanted: false, stackAmount: 1 }, iconPath: 'minecraft:stained_glass_pane' },
    });
    form.button(12, `§l§aRemove Item`, [], "minecraft:green_wool");
    form.button(14, `§l§cCancel`, [], "minecraft:red_wool");
    form.show(player).then(response => {
        if (response.canceled)
            return;
        if (response.selection === 12) {
            const inventory = target === null || target === void 0 ? void 0 : target.getComponent('equipment_inventory');
            //@ts-ignore
            inventory.setEquipment(slot, null);
        }
        else {
            showInventory(player, target);
        }
    });
}
function removeItemMenu(player, target, slot) {
    const form = new ChestFormData()
        .title(`§l§aRemove Item`)
        .pattern([0, 0], [
        'xxxxxxxxx',
        'xxx_x_xxx',
        'xxxxxxxxx',
    ], {
        //@ts-ignore
        x: { data: { itemName: '', itemDesc: [], enchanted: false, stackAmount: 1 }, iconPath: 'minecraft:stained_glass_pane' },
    });
    form.button(12, `§l§aRemove Item`, [], "minecraft:green_wool");
    form.button(14, `§l§cCancel`, [], "minecraft:red_wool");
    form.show(player).then(response => {
        if (response.canceled)
            return;
        if (response.selection === 12) {
            const inventory = target === null || target === void 0 ? void 0 : target.getComponent('minecraft:inventory');
            inventory.container.setItem(slot, null);
        }
        else {
            showInventory(player, target);
        }
    });
}
function getInventorySlots(numItems) {
    const slots = [];
    const groupSize = 7;
    for (let i = 0; i < numItems; i++) {
        slots.push(2 + (i % groupSize) + (2 * Math.floor(i / groupSize)));
    }
    return slots;
}
function getEquipmentEnchantments(equipment) {
    if (!equipment)
        return [];
    const enchantsComponent = equipment === null || equipment === void 0 ? void 0 : equipment.getComponent("enchantments");
    //@ts-ignore
    return enchantsComponent === null || enchantsComponent === void 0 ? void 0 : enchantsComponent.enchantments;
}