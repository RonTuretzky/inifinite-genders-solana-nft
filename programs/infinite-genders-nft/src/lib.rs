use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;
use mpl_token_metadata::{
    instructions::{CreateV1CpiBuilder, MintV1CpiBuilder, VerifyCollectionV1CpiBuilder},
    types::{Creator, PrintSupply, TokenStandard, Collection},
};

declare_id!("GNDRxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");

#[program]
pub mod infinite_genders_nft {
    use super::*;

    pub fn initialize_collection(
        ctx: Context<InitializeCollection>,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        let collection = &mut ctx.accounts.collection_state;
        collection.authority = ctx.accounts.authority.key();
        collection.total_minted = 0;
        collection.name = name;
        collection.symbol = symbol;
        collection.uri = uri;
        collection.collection_mint = ctx.accounts.collection_mint.key();
        
        msg!("Collection initialized: {}", collection.name);
        Ok(())
    }

    pub fn create_collection_nft(
        ctx: Context<CreateCollectionNft>,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"collection",
            ctx.accounts.collection_state.key().as_ref(),
            &[ctx.bumps.collection_authority],
        ]];

        let metadata = &ctx.accounts.metadata_program.to_account_info();
        
        CreateV1CpiBuilder::new(metadata)
            .metadata(&ctx.accounts.collection_metadata.to_account_info())
            .master_edition(Some(&ctx.accounts.collection_edition.to_account_info()))
            .mint(&ctx.accounts.collection_mint.to_account_info(), true)
            .authority(&ctx.accounts.collection_authority.to_account_info())
            .payer(&ctx.accounts.payer.to_account_info())
            .update_authority(&ctx.accounts.collection_authority.to_account_info(), true)
            .spl_token_program(&ctx.accounts.token_program.to_account_info())
            .system_program(&ctx.accounts.system_program.to_account_info())
            .sysvar_instructions(&ctx.accounts.sysvar_instructions.to_account_info())
            .name(name)
            .symbol(symbol)
            .uri(uri)
            .seller_fee_basis_points(500) // 5% royalties
            .creators(vec![Creator {
                address: ctx.accounts.authority.key(),
                verified: true,
                share: 100,
            }])
            .token_standard(TokenStandard::NonFungible)
            .print_supply(PrintSupply::Zero)
            .is_mutable(true)
            .invoke_signed(signer_seeds)?;

        msg!("Collection NFT created");
        Ok(())
    }

    pub fn mint_gender_nft(
        ctx: Context<MintGenderNft>,
        name: String,
        symbol: String,
        uri: String,
        gender_seed: u64,
    ) -> Result<()> {
        let collection_state = &mut ctx.accounts.collection_state;
        
        let mint_seeds: &[&[&[u8]]] = &[&[
            b"mint",
            collection_state.key().as_ref(),
            &collection_state.total_minted.to_le_bytes(),
            &[ctx.bumps.nft_mint],
        ]];

        let metadata = &ctx.accounts.metadata_program.to_account_info();
        
        CreateV1CpiBuilder::new(metadata)
            .metadata(&ctx.accounts.nft_metadata.to_account_info())
            .master_edition(Some(&ctx.accounts.nft_edition.to_account_info()))
            .mint(&ctx.accounts.nft_mint.to_account_info(), true)
            .authority(&ctx.accounts.mint_authority.to_account_info())
            .payer(&ctx.accounts.payer.to_account_info())
            .update_authority(&ctx.accounts.mint_authority.to_account_info(), true)
            .spl_token_program(&ctx.accounts.token_program.to_account_info())
            .system_program(&ctx.accounts.system_program.to_account_info())
            .sysvar_instructions(&ctx.accounts.sysvar_instructions.to_account_info())
            .name(name.clone())
            .symbol(symbol)
            .uri(uri.clone())
            .seller_fee_basis_points(500)
            .creators(vec![Creator {
                address: ctx.accounts.authority.key(),
                verified: false,
                share: 100,
            }])
            .token_standard(TokenStandard::NonFungible)
            .collection(Collection {
                verified: false,
                key: collection_state.collection_mint,
            })
            .print_supply(PrintSupply::Zero)
            .is_mutable(true)
            .invoke_signed(mint_seeds)?;

        MintV1CpiBuilder::new(metadata)
            .token(&ctx.accounts.recipient_token_account.to_account_info())
            .token_owner(Some(&ctx.accounts.recipient.to_account_info()))
            .metadata(&ctx.accounts.nft_metadata.to_account_info())
            .master_edition(Some(&ctx.accounts.nft_edition.to_account_info()))
            .mint(&ctx.accounts.nft_mint.to_account_info())
            .authority(&ctx.accounts.mint_authority.to_account_info())
            .payer(&ctx.accounts.payer.to_account_info())
            .spl_token_program(&ctx.accounts.token_program.to_account_info())
            .spl_ata_program(&ctx.accounts.associated_token_program.to_account_info())
            .system_program(&ctx.accounts.system_program.to_account_info())
            .sysvar_instructions(&ctx.accounts.sysvar_instructions.to_account_info())
            .amount(1)
            .invoke_signed(mint_seeds)?;

        VerifyCollectionV1CpiBuilder::new(metadata)
            .metadata(&ctx.accounts.nft_metadata.to_account_info())
            .collection_mint(&ctx.accounts.collection_mint.to_account_info())
            .collection_metadata(Some(&ctx.accounts.collection_metadata.to_account_info()))
            .collection_master_edition(Some(&ctx.accounts.collection_edition.to_account_info()))
            .authority(&ctx.accounts.collection_authority.to_account_info())
            .payer(&ctx.accounts.payer.to_account_info())
            .system_program(&ctx.accounts.system_program.to_account_info())
            .sysvar_instructions(&ctx.accounts.sysvar_instructions.to_account_info())
            .invoke_signed(&[&[
                b"collection",
                collection_state.key().as_ref(),
                &[ctx.bumps.collection_authority],
            ]])?;

        collection_state.total_minted += 1;
        
        emit!(GenderNftMinted {
            mint: ctx.accounts.nft_mint.key(),
            recipient: ctx.accounts.recipient.key(),
            gender_seed,
            token_id: collection_state.total_minted,
            name,
            uri,
        });

        msg!("Gender NFT #{} minted!", collection_state.total_minted);
        Ok(())
    }

    pub fn update_collection_metadata(
        ctx: Context<UpdateCollectionMetadata>,
        new_uri: Option<String>,
        new_name: Option<String>,
    ) -> Result<()> {
        let collection = &mut ctx.accounts.collection_state;
        
        if let Some(uri) = new_uri {
            collection.uri = uri;
        }
        
        if let Some(name) = new_name {
            collection.name = name;
        }
        
        msg!("Collection metadata updated");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeCollection<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + CollectionState::INIT_SPACE,
        seeds = [b"collection", authority.key().as_ref()],
        bump
    )]
    pub collection_state: Account<'info, CollectionState>,
    
    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = collection_authority,
        mint::freeze_authority = collection_authority,
        seeds = [b"collection_mint", collection_state.key().as_ref()],
        bump
    )]
    pub collection_mint: Account<'info, Mint>,
    
    #[account(
        seeds = [b"collection", collection_state.key().as_ref()],
        bump
    )]
    /// CHECK: PDA used as collection authority
    pub collection_authority: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CreateCollectionNft<'info> {
    #[account(
        mut,
        seeds = [b"collection", authority.key().as_ref()],
        bump,
        has_one = authority,
        has_one = collection_mint
    )]
    pub collection_state: Account<'info, CollectionState>,
    
    #[account(mut)]
    pub collection_mint: Account<'info, Mint>,
    
    /// CHECK: Metadata account
    #[account(mut)]
    pub collection_metadata: UncheckedAccount<'info>,
    
    /// CHECK: Edition account
    #[account(mut)]
    pub collection_edition: UncheckedAccount<'info>,
    
    #[account(
        seeds = [b"collection", collection_state.key().as_ref()],
        bump
    )]
    /// CHECK: PDA authority
    pub collection_authority: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    /// CHECK: Metaplex metadata program
    pub metadata_program: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    /// CHECK: Sysvar instructions
    pub sysvar_instructions: UncheckedAccount<'info>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintGenderNft<'info> {
    #[account(
        mut,
        seeds = [b"collection", authority.key().as_ref()],
        bump,
        has_one = authority
    )]
    pub collection_state: Account<'info, CollectionState>,
    
    #[account(
        init,
        payer = payer,
        mint::decimals = 0,
        mint::authority = mint_authority,
        mint::freeze_authority = mint_authority,
        seeds = [
            b"mint",
            collection_state.key().as_ref(),
            &collection_state.total_minted.to_le_bytes()
        ],
        bump
    )]
    pub nft_mint: Account<'info, Mint>,
    
    #[account(
        seeds = [b"mint_authority", collection_state.key().as_ref()],
        bump
    )]
    /// CHECK: PDA mint authority
    pub mint_authority: UncheckedAccount<'info>,
    
    /// CHECK: NFT metadata account
    #[account(mut)]
    pub nft_metadata: UncheckedAccount<'info>,
    
    /// CHECK: NFT edition account
    #[account(mut)]
    pub nft_edition: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub collection_mint: Account<'info, Mint>,
    
    /// CHECK: Collection metadata
    #[account(mut)]
    pub collection_metadata: UncheckedAccount<'info>,
    
    /// CHECK: Collection edition
    pub collection_edition: UncheckedAccount<'info>,
    
    #[account(
        seeds = [b"collection", collection_state.key().as_ref()],
        bump
    )]
    /// CHECK: Collection authority PDA
    pub collection_authority: UncheckedAccount<'info>,
    
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = nft_mint,
        associated_token::authority = recipient
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: NFT recipient
    pub recipient: UncheckedAccount<'info>,
    
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    /// CHECK: Metaplex metadata program
    pub metadata_program: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    /// CHECK: Sysvar instructions
    pub sysvar_instructions: UncheckedAccount<'info>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UpdateCollectionMetadata<'info> {
    #[account(
        mut,
        seeds = [b"collection", authority.key().as_ref()],
        bump,
        has_one = authority
    )]
    pub collection_state: Account<'info, CollectionState>,
    
    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct CollectionState {
    pub authority: Pubkey,
    pub collection_mint: Pubkey,
    pub total_minted: u64,
    #[max_len(50)]
    pub name: String,
    #[max_len(10)]
    pub symbol: String,
    #[max_len(200)]
    pub uri: String,
}

#[event]
pub struct GenderNftMinted {
    pub mint: Pubkey,
    pub recipient: Pubkey,
    pub gender_seed: u64,
    pub token_id: u64,
    pub name: String,
    pub uri: String,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid authority")]
    InvalidAuthority,
    #[msg("Collection already initialized")]
    AlreadyInitialized,
    #[msg("Invalid metadata")]
    InvalidMetadata,
    #[msg("Minting limit reached")]
    MintingLimitReached,
}