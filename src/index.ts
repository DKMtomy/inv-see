import { Enchantment, EntityEquippableComponent, EntityInventoryComponent, EquipmentSlot, ItemEnchantsComponent, ItemStack, Player, system, world } from '@minecraft/server';
import { ChestFormData } from './lib/forms.js';

type Item = {
    name: string,
    amount: number,
    typeId: string,
    slot: number,
    enchantments: EnchantmentC[]
}

enum CEquipmentSlot {
    MainHand = 'mainhand',
    OffHand = 'offhand',
    Head = 'head',
    Chest = 'chest',
    Legs = 'legs',
    Feet = 'feet'
}

function getEnchants(iterator: Iterator<Enchantment>): EnchantmentC[] {
    const iterable = {
        [Symbol.iterator]: () => iterator
    };

    // Convert the iterable to an array
    const enchantmentArray: Enchantment[] = [...iterable];

    return enchantmentArray.map(enchantment => ({
        name: `Enchantment: ${capitalize(enchantment.type.id)}`,
        level: enchantment.level
    }));
}


function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

type EnchantmentC = {
    name: string,
    level: number
}

world.afterEvents.itemUse.subscribe(evd => {

    // const inventory = evd.source?.getComponent('minecraft:inventory') as EntityInventoryComponent

    // inventory.container.setItem(0, evd.itemStack)

    if (evd.itemStack.typeId !== 'minecraft:compass') return;

    primaryMenu(evd.source);
});
function primaryMenu(player: Player) {
    const form = new ChestFormData()
        .title('§l§aMain Menu')

    const allPlayers = world.getAllPlayers();
    for (let i = 0; i < allPlayers.length; i++) {
        form.button(i, `§l§a${allPlayers[i].name}`, [], "minecraft:skull");
    }

    form.show(player).then(response => {
        if (response.canceled) return;

        const target = world.getAllPlayers()[response.selection] as Player

        showInventory(player, target)
    })
};

function isWithinRange(value: number, range: { start: number, end: number }): boolean {
    return value >= range.start && value <= range.end;
}

function showInventory(player: Player, target: Player) {

    const hotbar = [] as Item[]
    const inventoryItems = [] as Item[]
    const offhand = [] as Item[]
    const armor = [] as Item[]

    const inventory = target?.getComponent('minecraft:inventory') as EntityInventoryComponent
    const container = inventory.container

    for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i);
        if (!item) continue;

        const { nameTag: name, typeId, amount } = item;
        const enchants = item?.getComponent("enchantments") as ItemEnchantsComponent;
        const enchantmentsList = getEnchants(enchants?.enchantments[Symbol.iterator]());

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
        }

        if (isWithinRange(i, SLOT_RANGES.hotbar)) {
            hotbar.push(itemData);
        } else if (isWithinRange(i, SLOT_RANGES.inventory)) {
            inventoryItems.push(itemData);
        }
    }


    const equipmentInventory = target?.getComponent('equipment_inventory');

    const equipmentSlots = ['offhand', 'head', 'chest', 'legs', 'feet'];
    const equipmentData: Record<string, any> = {};

    equipmentSlots.forEach(slot => {
        //@ts-expect-error
        const item = equipmentInventory.getEquipment(slot);
        equipmentData[slot] = {
            item: item ?? null,
            enchantments: getEquipmentEnchantments(item)
        };
    });

    const slotsMapping = [
        { slotName: 'offhand', array: offhand, slotNum: 0 },
        { slotName: 'head', array: armor, slotNum: 0 },
        { slotName: 'chest', array: armor, slotNum: 1 },
        { slotName: 'legs', array: armor, slotNum: 2 },
        { slotName: 'feet', array: armor, slotNum: 3 }
    ];

    slotsMapping.forEach(({ slotName, array, slotNum }) => {
        const slotData = equipmentData[slotName];
        if (slotData.item) {
            array.push({
                name: slotData.item.nameTag,
                amount: slotData.item.amount,
                typeId: slotData.item.typeId,
                slot: slotNum,
                enchantments: getEnchants(slotData.enchantments[Symbol.iterator]())
            });
        }
    });

    const form = new ChestFormData('large')
        .title(`§l§6${target.name}'s Inventory`)
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
        })

    //armor
    for (let i = 0; i < 4; i++) {
        if (!armor[i]) {
            form.button(i * 9, `§l§cEmpty`, [], "minecraft:barrier");
            continue;
        }
        let enchantmentsStringArray = armor[i]?.enchantments.map(enchantment => {
            return `${enchantment.name} (${enchantment.level})`;
        });
        let enchanted = enchantmentsStringArray?.length > 0;
        form.button(i * 9, `${armor[i].name || armor[i].typeId.replace("minecraft:", "").replace("_", " ")}`, enchantmentsStringArray, armor[i].typeId, armor[i].amount, enchanted);
    }

    if (offhand[0]) {
        //offhand
        let enchantmentsStringArray = offhand[0]?.enchantments.map(enchantment => {
            return `${enchantment.name} (${enchantment.level})`;
        });
        let enchanted = enchantmentsStringArray?.length > 0;
        form.button(28, `${offhand[0].name || offhand[0].typeId.replace("minecraft:", "").replace("_", " ")}`, [], offhand[0].typeId, offhand[0].amount, enchanted);
    }

    //hotbar + inventory
    for (let i = 0; i < hotbar.length; i++) {
        if (!hotbar[i]) continue;
        let enchantmentsStringArray = hotbar[i].enchantments.map(enchantment => {
            return `${enchantment.name} (${enchantment.level})`;
        });
        let enchanted = enchantmentsStringArray.length > 0;
        form.button(i + 45, `${hotbar[i].name || hotbar[i].typeId.replace("minecraft:", "").replace("_", " ")}`, enchantmentsStringArray, hotbar[i].typeId, hotbar[i].amount, enchanted);
    }

    form.button(44, `§l§aRefresh`, ['This refreshes the players inventory'], "minecraft:green_wool")

    // Main Inventory it is suposed to start at slot 2 and then go intill 8 and then from 11 to 17 and then from 20 to 26 and then from 29 to 35 and then from 38 to 44 but we make a formula
    const inventorySlots = getInventorySlots(inventoryItems.length);

    for (let i = 0; i < inventoryItems.length; i++) {
        let item = inventoryItems[i];
        let slot = inventorySlots[i];
        if (!item) continue;

        let enchantmentsStringArray = item.enchantments.map(enchantment => {
            return `${enchantment.name} (${enchantment.level})`;
        });

        let enchanted = enchantmentsStringArray.length > 0;

        form.button(slot, `${item.name || item.typeId.replace("minecraft:", "").replace("_", " ")}`, enchantmentsStringArray, item.typeId, item.amount, enchanted);
    }


    form.show(player).then(response => {
        if (response.canceled) return;

        type ArmorMappingType = {
            [key: string]: CEquipmentSlot | undefined;
            helmet: CEquipmentSlot;
            chestplate: CEquipmentSlot;
            leggings: CEquipmentSlot;
            boots: CEquipmentSlot;
            offhand: CEquipmentSlot;
        }

        const armorTypeToSlotMapping: ArmorMappingType = {
            helmet: CEquipmentSlot.Head,
            chestplate: CEquipmentSlot.Chest,
            leggings: CEquipmentSlot.Legs,
            boots: CEquipmentSlot.Feet,
            offhand: CEquipmentSlot.OffHand
        };


        for (let armorType in armorTypeToSlotMapping) {


            if (armor[response.selection / 9]?.typeId.includes(armorType)) {
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
            const item = hotbar[response.selection - 45]
            removeItemMenu(player, target, item.slot)
        }

        //if it is the inventory get the right item cus for some reason all the slots get pushed forward if its an empty slot
        if (response.selection >= 2 && response.selection <= 35) {
            if (desiredSlots.includes(response.selection)) {
                const item = inventoryItems[desiredSlots.indexOf(response.selection)]
                removeItemMenu(player, target, item.slot)
            }
        }

        if (response.selection === 44) {
            showInventory(player, target)
        }
    })
}

const desiredSlots = [2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 16, 17, 20, 21, 22, 23, 24, 25, 26, 29, 30, 31, 32, 33, 34, 35];

function getInventorySlots(length: number) {

    return desiredSlots.slice(0, length);
}

function removeArmorMenu(player: Player, target: Player, slot: CEquipmentSlot) {

    const form = new ChestFormData()
        .title(`§l§aRemove Item`)
        .pattern([0, 0], [
            'xxxxxxxxx',
            'xxx_x_xxx',
            'xxxxxxxxx',
        ], {
            //@ts-ignore
            x: { data: { itemName: '', itemDesc: [], enchanted: false, stackAmount: 1 }, iconPath: 'minecraft:stained_glass_pane' },
        })

    form.button(12, `§l§aRemove Item`, [], "minecraft:green_wool");
    form.button(14, `§l§cCancel`, [], "minecraft:red_wool");

    form.show(player).then(response => {
        if (response.canceled) return;

        if (response.selection === 12) {
            const inventory = target?.getComponent('equipment_inventory')

            //@ts-ignore
            inventory.setEquipment(slot, null)
        }

        else {
            showInventory(player, target)
        }
    })
}

function removeItemMenu(player: Player, target: Player, slot: number) {
    const form = new ChestFormData()
        .title(`§l§aRemove Item`)
        .pattern([0, 0], [
            'xxxxxxxxx',
            'xxx_x_xxx',
            'xxxxxxxxx',
        ], {
            //@ts-ignore
            x: { data: { itemName: '', itemDesc: [], enchanted: false, stackAmount: 1 }, iconPath: 'minecraft:stained_glass_pane' },
        })

    form.button(12, `§l§aRemove Item`, [], "minecraft:green_wool");
    form.button(14, `§l§cCancel`, [], "minecraft:red_wool");

    form.show(player).then(response => {
        if (response.canceled) return;

        if (response.selection === 12) {
            const inventory = target?.getComponent('minecraft:inventory') as EntityInventoryComponent

            inventory.container.setItem(slot, null)
        }

        else {
            showInventory(player, target)
        }
    })
}

function getEquipmentEnchantments(equipment: any): any[] {
    if (!equipment) return [];
    const enchantsComponent = equipment?.getComponent("enchantments") as ItemEnchantsComponent;
    //@ts-ignore
    return enchantsComponent?.enchantments;
}